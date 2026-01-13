<!doctype html>
<html lang="sk">
<head>
  <meta charset="utf-8">
  <style>
    @page {
      margin: 2.2cm 2.2cm 2.2cm 2.2cm;
    }

    body {
      font-family: "DejaVu Sans", sans-serif;
      font-size: 11pt;
      line-height: 1.25;
      color: #000;
    }

    h1 {
      text-align: center;
      font-size: 12pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 0 0 6pt 0;
    }

    .subtitle {
      text-align: center;
      margin: 0 0 12pt 0;
    }

    .block {
      margin: 6pt 0;
    }

    .section-title {
      font-weight: bold;
      margin-top: 12pt;
    }

    table.info {
      width: 100%;
      border-collapse: collapse;
      margin: 6pt 0 10pt 0;
    }

    table.info td {
      padding: 2pt 4pt;
      vertical-align: top;
    }

    table.info td.label {
      width: 40%;
      font-weight: normal;
    }

    table.info td.value {
      width: 60%;
    }

    .indent {
      margin-left: 18pt;
    }

    .indent-more {
      margin-left: 36pt;
    }

    .dates {
      width: 100%;
      margin-top: 14pt;
    }

    .dates td {
      vertical-align: top;
    }

    .text-right {
      text-align: right;
    }

    .signatures {
      width: 100%;
      margin-top: 18pt;
      border-collapse: collapse;
    }

    .signatures td {
      width: 50%;
      vertical-align: top;
      padding: 0 6pt;
    }

    .signature-line {
      border-bottom: 1px solid #000;
      height: 16pt;
      margin-bottom: 4pt;
    }

    .signature-name {
      text-align: center;
      margin-top: 4pt;
    }

    .signature-title {
      text-align: center;
      font-size: 10pt;
      margin-top: 2pt;
    }

    .student-signature {
      margin-top: 18pt;
      width: 60%;
      margin-left: auto;
      margin-right: auto;
    }
  </style>
</head>
<body>
  <script type="text/php">
    if (isset($pdf) && isset($fontMetrics)) {
        $fontItalic = $fontMetrics->getFont("DejaVu Sans", "italic");
        $fontNormal = $fontMetrics->getFont("DejaVu Sans", "normal");
        $size = 8;

        if ($PAGE_NUM == 1) {
            $text = "Platnosť tlačiva od 1.10.2024 (aplikovaná informatika)";
            $pdf->page_text(360, 20, $text, $fontItalic, $size);
        }

        $pageText = "{PAGE_NUM}";
        $pageWidth = 595;
        $textWidth = $fontMetrics->getTextWidth($pageText, $fontNormal, $size);
        $x = ($pageWidth - $textWidth) / 2;
        $pdf->page_text($x, 820, $pageText, $fontNormal, $size);
    }
  </script>

  <h1>Dohoda o odbornej praxi študenta</h1>
  <p class="subtitle">uzatvorená v zmysle § 51 Občianskeho zákonníka a Zákona č. 131/2002 Z.z. o vysokých školách</p>

  <p class="block"><strong>Univerzita Konštantína Filozofa v Nitre</strong><br>
    Fakulta prírodných vied a informatiky<br>
    Trieda A. Hlinku 1, 949 01 Nitra<br>
    v zastúpení Dr. h. c. prof. RNDr. František Petrovič, PhD., MBA - dekan fakulty<br>
    e-mail: dfpvai@ukf.sk&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;tel. 037/6408 555
  </p>

  <p class="section-title">Poskytovateľ odbornej praxe (organizácia, resp. inštitúcia)</p>
  <table class="info">
    <tr>
      <td class="label">Plný názov a adresa:</td>
      <td class="value">{{ $company_name_address }}</td>
    </tr>
    <tr>
      <td class="label">v zastúpení:</td>
      <td class="value">{{ $company_representative }}</td>
    </tr>
  </table>

  <p class="section-title">Študent:</p>
  <table class="info">
    <tr>
      <td class="label">Meno a priezvisko:</td>
      <td class="value">{{ $student_fullname }}</td>
    </tr>
    <tr>
      <td class="label">Adresa trvalého bydliska:</td>
      <td class="value">{!! nl2br(e($student_address)) !!}</td>
    </tr>
    <tr>
      <td class="label">E-mail:</td>
      <td class="value">{{ $student_email }}</td>
    </tr>
    <tr>
      <td class="label">Telefón:</td>
      <td class="value">{{ $student_phone }}</td>
    </tr>
    <tr>
      <td class="label">Študijný program:</td>
      <td class="value">{{ $study_type }}</td>
    </tr>
  </table>

  <p class="block">uzatvárajú túto dohodu o odbornej praxi študenta.</p>

  <p class="section-title">I. Predmet dohody</p>
  <p>Predmetom tejto dohody je vykonanie odbornej praxe študenta v rozsahu 150 hodín, v termíne od {{ $start_date }} do {{ $end_date }} bezodplatne.</p>

  <p class="section-title">II. Práva a povinnosti účastníkov dohody</p>
  <p><strong>1.</strong> Fakulta prírodných vied a informatiky Univerzity Konštantína Filozofa v Nitre:</p>
  <p class="indent">Poverí svojho zamestnanca: Mgr. Dominik Halvoník, PhD. (ďalej garant odbornej praxe) garanciou odbornej praxe.</p>
  <p class="indent"><strong>1.2</strong> Prostredníctvom garanta odbornej praxe:</p>
  <p class="indent-more">a) poskytne študentovi:</p>
  <p class="indent-more">informácie o organizácii praxe, o podmienkach dojednania dohody o odbornej praxi, o obsahovom zameraní odbornej praxe a o požiadavkách na obsahovú náplň správy z odbornej praxe,</p>
  <p class="indent-more">návrh dohody o odbornej praxi študenta,</p>
  <p class="indent-more">b) rozhodne o udelení hodnotenia "ABS" (absolvoval) študentovi na základe dokladu "Výkaz o vykonanej odbornej praxi", vydaného poskytovateľom odbornej praxe a na základe študentom vypracovanej správy o odbornej praxi, ktorej súčasťou je verejná obhajoba výsledkov odbornej praxe,</p>
  <p class="indent-more">c) spravuje vyplnenú a účastníkmi podpísanú dohodu o odbornej praxi.</p>

  <p><strong>2.</strong> Poskytovateľ odbornej praxe:</p>
  <p class="indent">2.1 poverí svojho zamestnanca (tútor - zodpovedný za odbornú prax v organizácii) {{ $company_tutor_acc }}, ktorý bude dohliadať na dodržiavanie dohody o odbornej praxi, plnenie obsahovej náplne odbornej praxe a bude nápomocný pri získavaní potrebných údajov pre vypracovanie správy z odbornej praxe,</p>
  <p class="indent">2.2 na začiatku praxe vykoná poučenie o bezpečnosti a ochrane zdravia pri práci v zmysle platných predpisov,</p>
  <p class="indent">2.3 vzniknuté organizačné problémy súvisiace s plnením dohody rieši spolu s garantom odbornej praxe,</p>
  <p class="indent">2.4 po ukončení odbornej praxe vydá študentovi "Výkaz o vykonanej odbornej praxe", ktorý obsahuje popis vykonávaných činností a stručné hodnotenie študenta a je jedným z predpokladov úspešného ukončenia predmetu Odborná prax,</p>
  <p class="indent">2.5 umožní garantovi odbornej praxe a garantovi študijného predmetu kontrolu študentom plnených úloh.</p>

  <p><strong>3.</strong> Študent FPVaI UKF v Nitre:</p>
  <p class="indent">3.1 osobne zabezpečí podpísanie tejto dohody o odbornej praxi študenta,</p>
  <p class="indent">3.2 zodpovedne vykonáva činnosti pridelené tútorom odbornej praxe,</p>
  <p class="indent">3.3 zabezpečí doručenie dokladu "Výkaz o vykonanej odbornej praxe" najneskôr v termínoch predpísaných garantom pre daný semester,</p>
  <p class="indent">3.4 okamžite, bez zbytočného odkladu informuje garanta odbornej praxe o problémoch, ktoré bránia plneniu odbornej praxe.</p>

  <p class="section-title">III. Všeobecné a záverečné ustanovenia</p>
  <p>Dohoda sa uzatvára na dobu určitú. Dohoda nadobúda platnosť a účinnosť dňom podpísania obidvomi zmluvnými stranami. Obsah dohody sa môže meniť písomne len po súhlase jej zmluvných strán.</p>
  <p>Diela vytvorené študentom sa spravujú režimom zamestnaneckého diela podľa § 90 zákona č. 185/2015 Z. z. (Autorský zákon). V prípade, že sa dielo stane školským dielom podľa § 93 citovaného zákona, Fakulta prírodných vied a informatiky Univerzity Konštantína Filozofa v Nitre týmto udeľuje Poskytovateľovi odbornej praxe výhradnú, časovo a teritoriálne neobmedzenú, bezodplatnú licenciu na akékoľvek použitie alebo sublicenciu diel vytvorených študentom počas trvania odbornej praxe.</p>
  <p>Dohoda sa uzatvára v 3 vyhotoveniach, každá zmluvná strana obdrží jedno vyhotovenie dohody.</p>

  <table class="dates">
    <tr>
      <td>V Nitre, dňa {{ $date_nitra }}</td>
      <td class="text-right">V {{ $company_city }}, dňa {{ $date_company }}</td>
    </tr>
  </table>

  <table class="signatures">
    <tr>
      <td>
        <div class="signature-line"></div>
        <div class="signature-name">Dr. h. c. prof. RNDr. František Petrovič, PhD., MBA</div>
        <div class="signature-title">dekan FPVaI UKF v Nitre</div>
      </td>
      <td>
        <div class="signature-line"></div>
        <div class="signature-name">{{ $company_signer_name }}</div>
        <div class="signature-title">štatutárny zástupca pracoviska odb. praxe</div>
      </td>
    </tr>
  </table>

  <div class="student-signature">
    <div class="signature-line"></div>
    <div class="signature-name">{{ $student_fullname }}</div>
    <div class="signature-title">meno a priezvisko študenta</div>
  </div>
</body>
</html>
