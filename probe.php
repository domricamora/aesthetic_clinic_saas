<?php
$r = (new App\Actions\Dashboard\ClinicAnalytics(30))->toArray();
echo "days: " . count($r['daily']) . PHP_EOL;
echo "revenue: " . $r['money']['revenue'] . PHP_EOL;
echo "profit: " . $r['money']['profit'] . PHP_EOL;
echo "cogs: " . $r['money']['cost_of_goods'] . PHP_EOL;
echo "first day: " . json_encode($r['daily'][0]) . PHP_EOL;
echo "treatments: " . count($r['top_treatments']) . PHP_EOL;
echo "payments: " . count($r['payment_mix']) . PHP_EOL;
echo "frontdesk: " . json_encode($r['front_desk']) . PHP_EOL;
