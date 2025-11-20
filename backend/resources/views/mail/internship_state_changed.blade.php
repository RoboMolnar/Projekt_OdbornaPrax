<!doctype html>
<html lang="sk">
  <head>
    <meta charset="utf-8">
    <title>Zmena stavu praxe</title>
  </head>
  <body style="font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial;">
    <h2 style="margin:0 0 12px 0;">Dobrý deň, {{ $studentName }}</h2>

    <p style="margin:0 0 12px 0;">
      Stav Vašej odbornej praxe bol zmenený
      @if($oldStatus)
        z <strong>{{ $oldStatus }}</strong>
      @endif
      na <strong>{{ $newStatus }}</strong>.
    </p>

    <table style="margin:12px 0;border-collapse:collapse;">
      <tr>
        <td style="padding:4px 8px;color:#64748b;">Firma:</td>
        <td style="padding:4px 8px;color:#0f172a;"><strong>{{ $companyName ?: '—' }}</strong></td>
      </tr>
      <tr>
        <td style="padding:4px 8px;color:#64748b;">Obdobie:</td>
        <td style="padding:4px 8px;color:#0f172a;">{{ $startDate }} – {{ $endDate }}</td>
      </tr>
      <tr>
        <td style="padding:4px 8px;color:#64748b;">Rok / Semester:</td>
        <td style="padding:4px 8px;color:#0f172a;">{{ $year }} / {{ $semester }}</td>
      </tr>
    </table>

    <p style="margin:12px 0;color:#64748b;">
      Toto je automatická správa, prosím neodpovedajte na ňu.
    </p>

    <p style="margin:24px 0 0 0;color:#0f172a;">Ďakujeme,</p>
    <p style="margin:4px 0 0 0;color:#0f172a;">Tím Odborná prax</p>
  </body>
</html>
