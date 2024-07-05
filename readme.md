# AWS Mailer Edge Cases

1. Success path:

- User connects aws credentials. Credentials check shows full account access with no issues. 🟢
- User adds an email or domain for sending. After a few minutes our APIs notice sender identity has been successfully verified. 🟢
- User applies for production ses access. After a few hours our APIs detect that their account now has access to sending production level email campaigns. 🟢

2. Error path:

- User connects aws credentials. 🟢
    - Aws credentials do not have the right permissions to ses and sns: reject credentials. 🟢

- User adds email or domain for sending.
    - Sending identity is in pending state until aws confirms that the sender identity has been verified. 🟢
    - Cannot send any broadcasts with this mailer identity until it is verified. 🟡
    - Can only send test emails or small broadcasts with this mailer. 🟡

- User has verified sender identity. But no production access yet.
    - User cannot send any broadcasts 🟡
    - User can only send test campaigns 🟡
    - User sending throttle is based on quota limit. Example: 200 emails per day means we show mails sent on dashboard for that day with amount of quota left. 🟡

- User aws credentials lose access 🟢
    - On dashboard, user sees warning that mailer has lost access.
        - Possible action: reconnect mailer by providing new AWS access and secret key. This is a new flow that allows for reconnecting the mailer without deleting mailer. 🟢
        - Possible action: deleting mailer and starting with new mailer. This is risky as it will have to delete all sender identities also. 🔴
    - User can no longer use mailer to send broadcasts. User sees no errors when fetching mailers or mailer identities via api. 🟡

- User domain/email verification fails
    - Display retry action on dashboard. This action will delete the identity, recreate it so user has a chance to retry verification again. 🔴
    - Display action to replace with a different mailer identity (email or domain). This deletes the old mailer and adds a new one and waits for verification. 🔴
    - User cannot use mailer to send broadcasts. User sees no errors when fetching mailers or mailer identities via api. 🔴

# Constraints

1. Only one mailer per team. This avoids a ton of confusion. The idea should be, a new team is for a new project / new aws account. That way, you can't send email on a team unless you connect the mailer for that team.  🟢

2. Mailer must be approved before any broadcasts can be sent. But user sees a notification that they can't send email yet, at least until they get the mailer approved. 
