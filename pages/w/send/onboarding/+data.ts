import { createHighlighterCore, type LanguageInput } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import type { PageContextWithPageProps } from '#root/pages/hooks/use_page_props'

async function data(ctx: PageContextWithPageProps) {
  const email = ctx?.user?.email
  const from = ''

  const sdks = [
    {
      name: 'Node.js',
      lang: import('@shikijs/langs/typescript'),
      code: nodejsSdkUsage(email, from),
      langCode: 'typescript',
    },
    {
      name: 'Python',
      lang: import('@shikijs/langs/python'),
      code: pythonSdkUsage(email, from),
      langCode: 'python',
    },
    {
      name: 'Ruby',
      lang: import('@shikijs/langs/ruby'),
      code: rubySdkUsage(email, from),
      langCode: 'ruby',
    },
    {
      name: 'Go',
      lang: import('@shikijs/langs/go'),
      code: goSdkUsage(email, from),
      langCode: 'go',
    },
    {
      name: 'cURL',
      lang: import('@shikijs/langs/shell'),
      code: curlSdkUsage(email, from),
      langCode: 'shell',
    },
    {
      name: 'PHP',
      lang: import('@shikijs/langs/php'),
      code: phpSdkUsage(email, from),
      langCode: 'php',
    },
  ] satisfies { name: string; lang: LanguageInput; code: string; langCode: string }[]

  const highlighter = await createHighlighterCore({
    themes: [import('@shikijs/themes/material-theme-darker')],
    langs: sdks.reduce((langs, { lang }) => {
      langs.push(lang)

      return langs
    }, [] as LanguageInput[]),
    engine: createJavaScriptRegexEngine(),
  })

  const sdksWithHighlight = sdks.map((sdk) => {
    return {
      name: sdk.name,
      code: highlighter.codeToHtml(sdk.code, {
        lang: sdk.langCode,
        theme: 'material-theme-darker',
      }),
    }
  })

  highlighter.dispose()

  return {
    email: ctx?.user?.email,
    sdks: sdksWithHighlight,
  }
}

export { data }

function nodejsSdkUsage(email: string, from: string) {
  return /* Typescript */ `
  import { Kibamail } from 'kibamail'

  const kibamail = new Kibamail('••••••••••••••••••••••••••••••••••••')

  kibamail.emails.send({
      from: '${from}',
      to: '${email}',
      subject: 'my first email via kibamail api',
      html: '<p>you sent your first email using kibamail. congratulations 🎉!</p>',
  })

`
}

function pythonSdkUsage(email: string, from: string) {
  return /* Python */ `
  from kibamail import Kibamail

  kibamail = Kibamail('••••••••••••••••••••••••••••••••••••')

  kibamail.emails.send({
      'from': '${from}',
      'to': '${email}',
      'subject': 'my first email via kibamail api',
      'html': '<p>you sent your first email using kibamail. congratulations 🎉!</p>',
  })

`
}

function rubySdkUsage(email: string, from: string) {
  return /* Ruby */ `
  require 'kibamail'

  kibamail = Kibamail.new('••••••••••••••••••••••••••••••••••••')

  kibamail.emails.send({
    from: '${from}',
    to: '${email}',
    subject: 'my first email via kibamail api',
    html: '<p>you sent your first email using kibamail. congratulations 🎉!</p>',
  })

`
}

function goSdkUsage(email: string, from: string) {
  return /* Go */ `
  package main

  import (
      "github.com/kibamail/kibamail-go"
  )

  func main() {
      client := kibamail.New("••••••••••••••••••••••••••••••••••••")

      client.Emails.Send(kibamail.SendEmailRequest{
          From:    "${from}",
          To:      "${email}",
          Subject: "my first email via kibamail api",
          HTML:    "<p>you sent your first email using kibamail. congratulations 🎉!</p>",
      })
  }

`
}

function curlSdkUsage(email: string, from: string) {
  return /* Shell */ `
  curl -X POST https://api.kibamail.com/v1/emails/send \\
    -H "Authorization: Bearer ••••••••••••••••••••••••••••••••••••" \\
    -H "Content-Type: application/json" \\
    -d '{
      "from": "${from}",
      "to": "${email}",
      "subject": "my first email via kibamail api",
      "html": "<p>you sent your first email using kibamail. congratulations 🎉!</p>"
    }'

`
}

function phpSdkUsage(email: string, from: string) {
  return /* PHP */ `
  <?php
  require_once 'vendor/autoload.php';

  use Kibamail\\Kibamail;

  $kibamail = new Kibamail('••••••••••••••••••••••••••••••••••••');

  $kibamail->emails->send([
      'from' => '${from}',
      'to' => '${email}',
      'subject' => 'my first email via kibamail api',
      'html' => '<p>you sent your first email using kibamail. congratulations 🎉!</p>',
  ]);

`
}
