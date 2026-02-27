$base = "http://localhost:3100"

$latencyProbes = @(
  @{ name = "booking_success"; method = "GET"; path = "/api/booking/availability?checkIn=2026-03-01&checkOut=2026-03-05" },
  @{ name = "booking_failure"; method = "GET"; path = "/api/booking/availability?checkIn=2026-03-05&checkOut=2026-03-01" },
  @{ name = "auth_success"; method = "POST"; path = "/api/auth/magic-link"; data = '{"email":"owner@example.com","intent":"booking"}' },
  @{ name = "auth_failure"; method = "POST"; path = "/api/auth/magic-link"; data = '{"email":"bad-email","intent":"booking"}' },
  @{ name = "contact_success"; method = "POST"; path = "/api/contact/submissions"; data = '{"name":"QA","email":"qa@example.com","message":"Need boarding info"}' },
  @{ name = "contact_failure"; method = "POST"; path = "/api/contact/submissions"; data = '{"name":"","email":"bad","message":""}' },
  @{ name = "review_success"; method = "POST"; path = "/api/reviews/submissions"; data = '{"name":"QA","rating":5,"comment":"Great"}' },
  @{ name = "review_failure"; method = "POST"; path = "/api/reviews/submissions"; data = '{"name":"","rating":0,"comment":""}' },
  @{ name = "review_list"; method = "GET"; path = "/api/reviews" }
)

$latencyRows = @()
foreach ($probe in $latencyProbes) {
  $times = @()
  $statuses = @()

  for ($i = 0; $i -lt 15; $i++) {
    if ($probe.method -eq "GET") {
      $out = curl.exe -s -o NUL -w "%{http_code} %{time_total}" ($base + $probe.path)
    }
    else {
      $out = curl.exe -s -o NUL -X POST -H "Content-Type: application/json" -d $probe.data -w "%{http_code} %{time_total}" ($base + $probe.path)
    }

    $parts = $out -split " "
    $status = [int]$parts[0]
    $ms = [math]::Round(([double]$parts[1]) * 1000, 2)

    $statuses += $status
    $times += $ms
  }

  $sorted = $times | Sort-Object
  $p95Index = [int][math]::Ceiling($sorted.Count * 0.95) - 1
  if ($p95Index -lt 0) { $p95Index = 0 }

  $latencyRows += [pscustomobject]@{
    name = $probe.name
    method = $probe.method
    path = $probe.path
    statuses = $statuses
    minMs = $sorted[0]
    p95Ms = $sorted[$p95Index]
    maxMs = $sorted[-1]
    meetsP95 = ($sorted[$p95Index] -le 2000)
  }
}

$latencyRows | ConvertTo-Json -Depth 6 | Set-Content "docs/audit_logs/issue26_latency_probe.json"

$routeChecks = @("/robots.txt", "/sitemap.xml") | ForEach-Object {
  $path = $_
  $out = curl.exe -s -o NUL -w "%{http_code}" ($base + $path)
  [pscustomobject]@{
    path = $path
    status = [int]$out
  }
}
$routeChecks | ConvertTo-Json -Depth 4 | Set-Content "docs/audit_logs/issue26_route_status_probe.json"

$pages = @("/", "/about", "/pricing", "/book", "/contact")
$metadataRows = @()
foreach ($path in $pages) {
  $status = [int](curl.exe -s -o NUL -w "%{http_code}" ($base + $path))
  $html = curl.exe -s ($base + $path)

  $title = ""
  $description = ""
  $brandInTitle = $false

  $titleMatch = [regex]::Match($html, "<title>(.*?)</title>")
  if ($titleMatch.Success) {
    $title = $titleMatch.Groups[1].Value
  }

  $descMatch = [regex]::Match($html, '<meta name="description" content="([^"]*)"')
  if ($descMatch.Success) {
    $description = $descMatch.Groups[1].Value
  }

  if ($title -like "*Zaine's Stay & Play*") {
    $brandInTitle = $true
  }

  $metadataRows += [pscustomobject]@{
    path = $path
    status = $status
    title = $title
    description = $description
    brandInTitle = $brandInTitle
  }
}
$metadataRows | ConvertTo-Json -Depth 5 | Set-Content "docs/audit_logs/issue26_metadata_probe.json"

Write-Output "WROTE docs/audit_logs/issue26_latency_probe.json"
Write-Output "WROTE docs/audit_logs/issue26_route_status_probe.json"
Write-Output "WROTE docs/audit_logs/issue26_metadata_probe.json"
