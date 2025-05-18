#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/../common/test.sh"

print_header "deploy playbook test"

source_vault_secrets

echo -e "${BLUE}[task]${NC} running app setup playbook first..."
run_playbook "playbooks/app/setup.yml" "app setup playbook"

if [ $? -ne 0 ]; then
    echo -e "${RED}[error]${NC} app setup playbook failed, cannot proceed with deploy test"
    exit 1
fi

TEST_TAG="v0.0.1"
echo -e "${BLUE}[task]${NC} using test tag: $TEST_TAG"

echo -e "${BLUE}[task]${NC} running deploy playbook..."
EXTRA_VARS="-e deploy_tag=$TEST_TAG -e infisical_service_token=test-token"
vagrant ssh ansible-root -c "cd /ansible && sudo -u ansible ansible-playbook -i inventory/staging/hosts playbooks/app/deploy.yml $EXTRA_VARS -vv"
DEPLOY_RESULT=$?

if [ $DEPLOY_RESULT -eq 0 ] && [ -f "$SCRIPT_DIR/verify.sh" ]; then
    export TEST_TAG="$TEST_TAG"
    run_verification "$SCRIPT_DIR/verify.sh" "deploy"
    VERIFY_RESULT=$?

    echo -e "\n${BLUE}[task]${NC} testing redeployment behavior..."

    echo -e "${BLUE}[task]${NC} attempting to redeploy the same tag (should fail)..."
    vagrant ssh ansible-root -c "cd /ansible && sudo -u ansible ansible-playbook -i inventory/staging/hosts playbooks/app/deploy.yml $EXTRA_VARS -vv"
    REDEPLOY_RESULT=$?

    if [ $REDEPLOY_RESULT -ne 0 ]; then
        echo -e "${GREEN}[✓] Test passed:${NC} redeployment of active tag correctly failed"
    else
        echo -e "${RED}[✗] Test failed:${NC} redeployment of active tag should have failed but succeeded"
        VERIFY_RESULT=1
    fi

    echo -e "${BLUE}[task]${NC} creating a new tag for testing non-active tag redeployment..."
    TEST_TAG_TEMP="v0.0.2"
    EXTRA_VARS_TEMP="-e deploy_tag=$TEST_TAG_TEMP -e infisical_service_token=test-token"

    echo -e "${BLUE}[task]${NC} deploying temporary tag..."
    vagrant ssh ansible-root -c "cd /ansible && sudo -u ansible ansible-playbook -i inventory/staging/hosts playbooks/app/deploy.yml $EXTRA_VARS_TEMP -vv"

    echo -e "${BLUE}[task]${NC} rolling back to original tag..."
    vagrant ssh ansible-root -c "cd /ansible && sudo -u ansible ansible-playbook -i inventory/staging/hosts playbooks/app/rollback.yml -e rollback_tag=$TEST_TAG -e infisical_service_token=test-token -vv"

    echo -e "${BLUE}[task]${NC} attempting to redeploy the non-active tag (should succeed)..."
    vagrant ssh ansible-root -c "cd /ansible && sudo -u ansible ansible-playbook -i inventory/staging/hosts playbooks/app/deploy.yml $EXTRA_VARS_TEMP -vv"
    REDEPLOY_NONACTIVE_RESULT=$?

    if [ $REDEPLOY_NONACTIVE_RESULT -eq 0 ]; then
        echo -e "${GREEN}[✓] Test passed:${NC} redeployment of non-active tag correctly succeeded"
    else
        echo -e "${RED}[✗] Test failed:${NC} redeployment of non-active tag should have succeeded but failed"
        VERIFY_RESULT=1
    fi

    exit $VERIFY_RESULT
else
    exit $DEPLOY_RESULT
fi
