[INFO] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] Attempting delivery for mx: 2a00:1450:4013:c07::1a
[DEBUG] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] deliver: Bettys-MacBook-Pro-2.local -> 2a00:1450:4013:c07::1a (via DNS)
[DEBUG] [1EDA6178-6CA9-47AE-8B44-021FD04108F6] [outbound] created outbound::{"port":25,"host":"2a00:1450:4013:c07::1a"}
[ERROR] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] Failed to get socket: connect EHOSTUNREACH 2a00:1450:4013:c07::1a:25 - Local (undefined:undefined)
[INFO] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] Attempting delivery for mx: 173.194.79.26
[DEBUG] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] deliver: Bettys-MacBook-Pro-2.local -> 173.194.79.26 (via DNS)
[DEBUG] [61D9ADD8-8017-4237-B6DF-82964DE6D361] [outbound] created outbound::{"port":25,"host":"173.194.79.26"}
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 220 mx.google.com ESMTP a640c23a62f3a-a8d25d9970csi572004166b.1002 - gsmtp\r\n
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] C: EHLO Bettys-MacBook-Pro-2.local
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 250-mx.google.com at your service, [102.219.153.221]\r\n
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 250-SIZE 157286400\r\n
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 250-8BITMIME\r\n
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 250-STARTTLS\r\n
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 250-ENHANCEDSTATUSCODES\r\n
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 250-PIPELINING\r\n
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 250-CHUNKING\r\n
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 250 SMTPUTF8\r\n
[DEBUG] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] Trying TLS for domain: gmail.com, host: 173.194.79.26
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] C: STARTTLS
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 220 2.0.0 Ready to start TLS\r\n
[DEBUG] [-] [core] client TLS upgrade in progress, awaiting secured.
[DEBUG] [-] [core] client TLS secured.
[INFO] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] secured verified=true cipher=TLS_AES_256_GCM_SHA384 version=TLSv1.3 cn=mx.google.com organization="" issuer="Google Trust Services" expires="Nov 4 07:16:04 2024 GMT" fingerprint=BB:8B:E6:F8:E1:77:0C:07:EC:3D:E1:34:4D:C3:24:CF:D8:EA:0B:77
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] C: EHLO Bettys-MacBook-Pro-2.local
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 250-mx.google.com at your service, [102.219.153.221]\r\n
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 250-SIZE 157286400\r\n
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 250-8BITMIME\r\n
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 250-ENHANCEDSTATUSCODES\r\n
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 250-PIPELINING\r\n
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 250-CHUNKING\r\n
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 250 SMTPUTF8\r\n
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] C: MAIL FROM:<bahdcoder@kb.openmailer.org>
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 250 2.1.0 OK a640c23a62f3a-a8d25d9970csi572004166b.1002 - gsmtp\r\n
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] C: RCPT TO:<bahdcoder@gmail.com>
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 250 2.1.5 OK a640c23a62f3a-a8d25d9970csi572004166b.1002 - gsmtp\r\n
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] C: DATA
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 354 Go ahead a640c23a62f3a-a8d25d9970csi572004166b.1002 - gsmtp\r\n
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] C: .
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 550-5.7.26 Your email has been blocked because the sender is unauthenticated.\r\n
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 550-5.7.26 Gmail requires all senders to authenticate with either SPF or DKIM.\r\n
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 550-5.7.26 \r\n
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 550-5.7.26 Authentication results:\r\n
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 550-5.7.26 DKIM = did not pass\r\n
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 550-5.7.26 SPF [kb.openmailer.org] with ip: [102.219.153.221] = did not pass\r\n
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 550-5.7.26 \r\n
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 550-5.7.26 For instructions on setting up authentication, go to\r\n
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] S: 550 5.7.26 https://support.google.com/mail/answer/81126#authentication a640c23a62f3a-a8d25d9970csi572004166b.1002 - gsmtp\r\n
[PROTOCOL] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] C: QUIT
[INFO] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] Bouncing mail: 550 5.7.26 Your email has been blocked because the sender is unauthenticated. 5.7.26 Gmail requires all senders to authenticate with either SPF or DKIM. 5.7.26 5.7.26 Authentication results: 5.7.26 DKIM = did not pass 5.7.26 SPF [kb.openmailer.org] with ip: [102.219.153.221] = did not pass 5.7.26 5.7.26 For instructions on setting up authentication, go to 5.7.26 https://support.google.com/mail/answer/81126#authentication a640c23a62f3a-a8d25d9970csi572004166b.1002 - gsmtp
[DEBUG] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] running bounce hooks
[DEBUG] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] running bounce hook in queue/bullmq plugin
[DEBUG] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] hook=bounce plugin=queue/bullmq function=hook_bounce params="" retval=CONT msg=""
[DEBUG] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] running bounce hook in queue/bullmq plugin
[DEBUG] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] hook=bounce plugin=queue/bullmq function=hook_bounce params="" retval=CONT msg=""
[INFO] [78407A3F-31FC-4937-80E7-A52CBDCAB1A4.1.1] [outbound] Bounce response from plugins: 900 undefined
[DEBUG] [-] [outbound] release_client: outbound::{"port":25,"host":"173.194.79.26"}
