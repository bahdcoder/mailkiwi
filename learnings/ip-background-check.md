# Advanced Steps for Investigating Email History and Reputation of a /28 Subnet

Thoroughly investigating the email history and reputation of a subnet, especially a smaller /28 block of IP addresses (which contains 16 IPs), requires a multi-step, detailed process. This process involves checking the past use of the IPs, monitoring their current reputation, and ensuring they are not associated with any malicious activity or blacklists. Below are advanced and detailed practical steps you can follow:

## 1. Identify the Subnet and Parent Subnet Information

- **CIDR Block Calculation**: Confirm the exact range of IP addresses within the /28 subnet. For example, if your subnet is `192.168.1.0/28`, this includes IP addresses from `192.168.1.0` to `192.168.1.15`.
- **Parent Subnet Identification**: Determine the larger subnet that encompasses your /28 subnet (e.g., a /24 or /16 block). This helps in assessing the reputation of neighboring IPs, which could impact your smaller subnet.

## 2. Historical Email Usage Investigation

- **Whois Lookup**: Start by performing a Whois lookup for the IP range to gather information about the ownership history of the subnet. This helps to identify if the IPs have changed hands or were associated with a known spammer.
  - Tools: `whois` command-line tool, online services like [ARIN](https://www.arin.net/) or [RIPE](https://www.ripe.net/).
- **Reverse DNS Check**: Verify if there are any existing PTR (reverse DNS) records for the IPs. Legitimate mail servers typically have PTR records set up, and investigating these can give clues about prior usage.
  - Tools: `dig` command-line tool, or online tools like [MXToolbox](https://mxtoolbox.com/ReverseLookup.aspx).

## 3. Blacklist Check

- **Manual Blacklist Lookup**: Check each IP address individually against major email blacklists and DNSBLs (DNS-based Blackhole Lists).

  - Tools: [MXToolbox](https://mxtoolbox.com/blacklists.aspx), [Spamhaus](https://www.spamhaus.org/lookup/), [MultiRBL](https://multirbl.valli.org/), [Talos Intelligence](https://talosintelligence.com/).
  - **Key Blacklists to Check**:
    - Spamhaus
    - Barracuda Reputation Block List (BRBL)
    - Sorbs DNSBL
    - Spamcop
    - Proofpoint

- **Automated Blacklist Monitoring**: Set up ongoing monitoring for blacklist entries across all IPs in your /28 subnet using services like [HetrixTools](https://hetrixtools.com/), [Debouncer](https://debouncer.com/), or custom scripts to periodically query blacklist APIs.

## 4. Reputation Check

- **Email Reputation Tools**: Use tools that provide detailed IP and domain reputation data. This can give insight into how email service providers (ESPs) perceive your IPs.

  - Tools: [Sender Score](https://www.validity.com/products/senderscore/), [Google Postmaster Tools](https://postmaster.google.com/), [Microsoft SNDS](https://sendersupport.olc.protection.outlook.com/snds/).
  - **Metrics to Examine**:
    - Sender Score (values range from 0-100; aim for 80+).
    - Historical sending behavior (volume, bounces, complaints).
    - Current ESP feedback loops and complaint rates.

- **Check Neighboring IPs in the Subnet**: Investigate the reputation of adjacent IPs within the larger parent subnet (e.g., /24 or /16) using similar tools. Neighboring IPs with poor reputations can affect your deliverability.

## 5. Malware and Abuse Reports

- **Abuse Reporting Databases**: Query databases and services that track abusive behavior and security threats.
  - Tools: [AbuseIPDB](https://www.abuseipdb.com/), [AlienVault OTX](https://otx.alienvault.com/), [ThreatMiner](https://www.threatminer.org/), [Shodan](https://www.shodan.io/).
  - **Look for**:
    - Reports of spam, phishing, or malware distribution.
    - Historical incidents of abuse associated with your IPs or neighboring ones.

## 6. Deep Packet Inspection and Traffic Analysis (Optional, Advanced)

- **Network Traffic Analysis**: If you have access to the IPs, perform deep packet inspection (DPI) to analyze traffic patterns and ensure no residual malicious activity or spam patterns are present.
  - Tools: [Wireshark](https://www.wireshark.org/), [Snort](https://www.snort.org/), [Zeek](https://zeek.org/).
- **Rate Limiting and Throttling**: Implement rate limiting and throttling for outgoing emails to prevent accidental spamming during testing or initial rollout phases.

## 7. Reverse WHOIS and Historical IP Research

- **Reverse WHOIS**: Investigate the historical ownership and domain associations with your IPs using reverse WHOIS tools. This can reveal if the IPs were linked to domains with a poor reputation.
  - Tools: [DomainTools Reverse WHOIS](https://research.domaintools.com/reverse-whois/), [Whoisology](https://whoisology.com/).
- **Historical IP Research**: Use tools like [Robtex](https://www.robtex.com/) or [Cymon](https://www.cymon.io/) to look at historical DNS and IP data, identifying past activities that might have damaged the reputation.

## 8. Email Sending Infrastructure Review

- **Check for Proper SPF, DKIM, and DMARC Records**: Ensure that any historical records associated with the IPs were properly set up. Misconfigured email authentication records can lead to poor reputation and deliverability issues.

  - Tools: [MXToolbox SPF & DKIM](https://mxtoolbox.com/spf.aspx), [DMARC Analyzer](https://dmarcian.com/), [Postmark SPF/DKIM Check](https://dmarc.postmarkapp.com/).

- **Monitor SMTP Logs**: If the IPs were previously used by other parties, review historical SMTP logs (if available) for patterns of abuse, such as high bounce rates or spam complaints.

## 9. Engage with ESPs for Reputation Whitelisting

- **Contact Major ESPs**: Proactively reach out to major ESPs (e.g., Gmail, Yahoo, Outlook) to inquire about the reputation of your IP addresses. Some ESPs allow for whitelisting of IPs or offer feedback on potential issues.
- **Apply for Whitelisting**: Apply for whitelisting with organizations like [Return Path Certification](https://www.validity.com/solutions/certification/) or [Cloudmark Sender Intelligence](https://www.cloudmark.com/en/products/cloudmark-sender-intelligence).

## 10. Consider Professional Reputation Monitoring Services

- **Professional Services**: Engage a third-party service specializing in IP reputation management and monitoring, such as [Proofpoint](https://www.proofpoint.com/us/products/email-protection/ip-reputation) or [Senderscore Certified](https://www.validity.com/solutions/certification/).
- **Regular Audits**: Conduct regular audits with these services to continuously monitor the reputation and mitigate any emerging risks.

## 11. Document Findings and Implement Preventive Measures

- **Create a Detailed Report**: Document your findings on the reputation, blacklist status, and history of each IP address in the /28 subnet. Include notes on the larger subnet and any preventive measures you've taken.
- **Preventive Measures**:
  - Implement strong security practices (e.g., firewalls, DDoS protection).
  - Ensure proper email authentication (SPF, DKIM, DMARC).
  - Regularly monitor outgoing email traffic for anomalies.
  - Use rate limiting and ensure compliance with email sending best practices (e.g., double opt-in for mailing lists).

By following these advanced steps, you can thoroughly investigate the email history and reputation of your /28 subnet and the larger subnet it belongs to, ensuring that you avoid any potential issues with deliverability due to poor past behavior or reputation damage.
