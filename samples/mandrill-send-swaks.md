swaks --to bahdcoder@gmail.com --from work@ikigaya.dev --port 587 --server smtp.mandrillapp.com --tls --auth-user crushing-tech --auth-password md-xxx
=== Trying smtp.mandrillapp.com:587...
=== Connected to smtp.mandrillapp.com.
<- 220 smtp.mandrillapp.com ESMTP
-> EHLO bettys-macbook-pro-2.local
<- 250-smtp.passthru
<- 250-SIZE 26214400
<- 250-STARTTLS
<- 250-AUTH PLAIN LOGIN
<- 250-ENHANCEDSTATUSCODES
<- 250-8BITMIME
<- 250 XFILTERED
-> STARTTLS
<- 220 2.0.0 Ready to start TLS
=== TLS started with cipher TLSv1.3:AEAD-CHACHA20-POLY1305-SHA256:256
=== TLS client certificate not requested and not sent
=== TLS no client certificate set
=== TLS peer[0] subject=[/C=US/ST=Georgia/L=Atlanta/O=The Rocket Science Group LLC/CN=mandrillapp.com]
=== commonName=[mandrillapp.com], subjectAltName=[DNS:mandrillapp.com, DNS:www.mandrillapp.com, DNS:*.in1.mandrillapp.com, DNS:*.in2.mandrillapp.com, DNS:*.mandrillapp.com, DNS:*.us-west-2.tx-prod.prod.mandrillapp.com] notAfter=[2025-07-22T23:59:59Z]
=== TLS peer[1] subject=[/C=US/O=DigiCert Inc/OU=www.digicert.com/CN=Thawte TLS RSA CA G1]
=== commonName=[Thawte TLS RSA CA G1], subjectAltName=[] notAfter=[2027-11-02T12:24:25Z]
=== TLS peer certificate passed CA verification, passed host verification (using host smtp.mandrillapp.com to verify)
~> EHLO bettys-macbook-pro-2.local
<~ 250-relay-3.eu-central-1.tx-prod
<~ 250-PIPELINING
<~ 250-SIZE 26214400
<~ 250-AUTH PLAIN LOGIN
<~ 250-ENHANCEDSTATUSCODES
<~ 250-8BITMIME
<~ 250 CHUNKING
~> AUTH LOGIN
<~ 334 VXNlcm5hbWU6
~> Y3J1c2hpbmctdGVjaA==
<~ 334 UGFzc3dvcmQ6
~> bWQtbXFBeTlkeUw5QXFMMWtaUjhUcFJfZw==
<~ 235 2.7.0 Authentication successful
~> MAIL FROM:<work@ikigaya.dev>
<~ 250 2.1.0 Ok
~> RCPT TO:<bahdcoder@gmail.com>
<~ 250 2.1.5 Ok
~> DATA
<~ 354 End data with <CR><LF>.<CR><LF>
~> Date: Mon, 26 Aug 2024 15:05:03 +0100
~> To: bahdcoder@gmail.com
~> From: work@ikigaya.dev
~> Subject: test Mon, 26 Aug 2024 15:05:03 +0100
~> Message-Id: <20240826150503.052936@bettys-macbook-pro-2.local>
~> X-Mailer: swaks v20240103.0 jetmore.org/john/code/swaks/
~>
~> This is a test mailing
~>
~>
~> .
<~ 250 2.0.0 Ok: queued as F291A14004CB
~> QUIT
<~ 221 2.0.0 Bye
=== Connection closed with remote host.

swaks --to bahdcoder@gmail.com --from work@mandrill.ikigaya.dev --port 587 --server smtp.mandrillapp.com --tls --auth-user crushing-tech --auth-password md-xxx
=== Trying smtp.mandrillapp.com:587...
=== Connected to smtp.mandrillapp.com.
<- 220 smtp.mandrillapp.com ESMTP
-> EHLO bettys-macbook-pro-2.local
<- 250-smtp.passthru
<- 250-SIZE 26214400
<- 250-STARTTLS
<- 250-AUTH PLAIN LOGIN
<- 250-ENHANCEDSTATUSCODES
<- 250-8BITMIME
<- 250 XFILTERED
-> STARTTLS
<- 220 2.0.0 Ready to start TLS
=== TLS started with cipher TLSv1.3:AEAD-CHACHA20-POLY1305-SHA256:256
=== TLS client certificate not requested and not sent
=== TLS no client certificate set
=== TLS peer[0] subject=[/C=US/ST=Georgia/L=Atlanta/O=The Rocket Science Group LLC/CN=mandrillapp.com]
=== commonName=[mandrillapp.com], subjectAltName=[DNS:mandrillapp.com, DNS:www.mandrillapp.com, DNS:*.in1.mandrillapp.com, DNS:*.in2.mandrillapp.com, DNS:*.mandrillapp.com, DNS:*.us-west-2.tx-prod.prod.mandrillapp.com] notAfter=[2025-07-22T23:59:59Z]
=== TLS peer[1] subject=[/C=US/O=DigiCert Inc/OU=www.digicert.com/CN=Thawte TLS RSA CA G1]
=== commonName=[Thawte TLS RSA CA G1], subjectAltName=[] notAfter=[2027-11-02T12:24:25Z]
=== TLS peer certificate passed CA verification, passed host verification (using host smtp.mandrillapp.com to verify)
~> EHLO bettys-macbook-pro-2.local
<~ 250-relay-4.eu-central-1.tx-prod
<~ 250-PIPELINING
<~ 250-SIZE 26214400
<~ 250-AUTH PLAIN LOGIN
<~ 250-ENHANCEDSTATUSCODES
<~ 250-8BITMIME
<~ 250 CHUNKING
~> AUTH LOGIN
<~ 334 VXNlcm5hbWU6
~> Y3J1c2hpbmctdGVjaA==
<~ 334 UGFzc3dvcmQ6
~> bWQtbXFBeTlkeUw5QXFMMWtaUjhUcFJfZw==
<~ 235 2.7.0 Authentication successful
~> MAIL FROM:<work@mandrill.ikigaya.dev>
<~ 250 2.1.0 Ok
~> RCPT TO:<bahdcoder@gmail.com>
<~ 250 2.1.5 Ok
~> DATA
<~ 354 End data with <CR><LF>.<CR><LF>
~> Date: Mon, 26 Aug 2024 15:08:50 +0100
~> To: bahdcoder@gmail.com
~> From: work@mandrill.ikigaya.dev
~> Subject: test Mon, 26 Aug 2024 15:08:50 +0100
~> Message-Id: <20240826150850.053627@bettys-macbook-pro-2.local>
~> X-Mailer: swaks v20240103.0 jetmore.org/john/code/swaks/
~>
~> This is a test mailing
~>
~>
~> .
<~ 250 2.0.0 Ok: queued as 05884143230D
~> QUIT
<~ 221 2.0.0 Bye
=== Connection closed with remote host.
