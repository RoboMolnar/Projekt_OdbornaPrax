<!doctype html>
<html lang="sk">
  <head>
    <meta charset="utf-8">
    <title>Zmena stavu praxe</title>
  </head>

  <body style="margin:0;background:#f8fafc;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial;">
    <div style="max-width:640px;margin:0 auto;padding:24px;">
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 1px 2px rgba(15,23,42,0.06);overflow:hidden;">

        <!-- Header -->
        <div style="padding:18px 20px;border-bottom:1px solid #e2e8f0;">
          <h2 style="margin:0;color:#0f172a;font-size:20px;line-height:1.2;">
            Dobrý deň, {{ $studentName }}
          </h2>
          <p style="margin:6px 0 0 0;color:#64748b;font-size:13px;">
            Notifikácia o zmene stavu odbornej praxe
          </p>
        </div>

        <!-- Body -->
        <div style="padding:18px 20px;color:#0f172a;">
          <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;">
            Stav Vašej odbornej praxe bol zmenený
            @if(!empty($changedBy))
              <strong>{{ $changedBy }}</strong>
            @endif
            @if($oldStatus)
              z <strong>{{ $oldStatus }}</strong>
            @endif
            na <strong>{{ $newStatus }}</strong>.
          </p>

          <!-- Info box -->
          <div style="border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;padding:12px 14px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:6px 0;color:#64748b;font-size:13px;white-space:nowrap;">Firma:</td>
                <td style="padding:6px 0;color:#0f172a;font-size:13px;"><strong>{{ $companyName ?: '—' }}</strong></td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#64748b;font-size:13px;white-space:nowrap;">Obdobie:</td>
                <td style="padding:6px 0;color:#0f172a;font-size:13px;">{{ $startDate }} – {{ $endDate }}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#64748b;font-size:13px;white-space:nowrap;">Rok / Semester:</td>
                <td style="padding:6px 0;color:#0f172a;font-size:13px;">{{ $year }} / {{ $semester }}</td>
              </tr>
              @if(!empty($id))
              <tr>
                <td style="padding:6px 0;color:#64748b;font-size:13px;white-space:nowrap;">ID praxe:</td>
                <td style="padding:6px 0;color:#0f172a;font-size:13px;">#{{ $id }}</td>
              </tr>
              @endif
            </table>
          </div>

          <p style="margin:14px 0 0 0;color:#64748b;font-size:12px;line-height:1.5;">
            Toto je automatická správa, prosím neodpovedajte na ňu.
          </p>

          <div style="margin-top:18px;">
            <p style="margin:0;color:#0f172a;">Ďakujeme,</p>
            <p style="margin:4px 0 0 0;color:#0f172a;">Tím Odborná prax</p>
          </div>
        </div>

      </div>

      <!-- Footer tiny -->
      <p style="margin:14px 0 0 0;color:#94a3b8;font-size:11px;text-align:center;">
        Portál odbornej praxe
      </p>
    </div>
  </body>
</html>
