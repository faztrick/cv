param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Url,

  [Parameter(Mandatory = $false)]
  [switch]$Json,

  [Parameter(Mandatory = $false)]
  [switch]$Raw
)

<#
.SYNOPSIS
Parses a Figma URL into fileKey and nodeId (colon format).

.DESCRIPTION
Supports both /design and /file URL shapes. Extracts fileKey and node-id from query.
If node-id uses hyphen delimiter (e.g., 123-456), it is converted to colon (123:456).

.PARAMETER Url
The Figma URL to parse.

.PARAMETER Json
Outputs the result as compact JSON.

.PARAMETER Raw
Outputs only the values in the form: <fileKey> <nodeId>

.EXAMPLE
pwsh -File e:\cv\tools\figma-url-parse.ps1 "https://www.figma.com/design/KEY/Name?node-id=0-1"

.EXAMPLE
pwsh -File e:\cv\tools\figma-url-parse.ps1 "https://www.figma.com/file/KEY/Name?node-id=0%3A1" -Json
#>

function ConvertFrom-QueryString {
  param(
    [string]$Query
  )
  $result = @{}
  if (-not $Query) { return $result }
  $q = $Query
  if ($q.StartsWith('?')) { $q = $q.Substring(1) }
  foreach ($pair in $q.Split('&', [System.StringSplitOptions]::RemoveEmptyEntries)) {
    $kv = $pair.Split('=', 2)
    $k = [System.Uri]::UnescapeDataString($kv[0])
    $v = if ($kv.Count -gt 1) { [System.Uri]::UnescapeDataString($kv[1]) } else { '' }
    $result[$k] = $v
  }
  return $result
}

try {
  $uri = [System.Uri]$Url
}
catch {
  Write-Error "Invalid URL: $Url"
  exit 1
}

$segments = $uri.AbsolutePath.Trim('/').Split('/')
if ($segments.Length -lt 2 -or ($segments[0] -ne 'design' -and $segments[0] -ne 'file')) {
  Write-Error 'Not a valid Figma URL. Expected path like /design/<fileKey>/<fileName> or /file/<fileKey>/<fileName>'
  exit 1
}

$fileKey = $segments[1]

# Parse query for node-id
$qs = ConvertFrom-QueryString -Query $uri.Query
$nodeIdRaw = $qs['node-id']

if (-not $nodeIdRaw) {
  Write-Warning 'No node-id found in URL query. You can still use the fileKey.'
}

# Normalize node-id: hyphen to colon if needed
$nodeId = $null
if ($nodeIdRaw) {
  if ($nodeIdRaw -match ':') {
    $nodeId = $nodeIdRaw
  }
  else {
    $nodeId = $nodeIdRaw -replace '-', ':'
  }
}

$obj = [pscustomobject]@{
  FileKey = $fileKey
  NodeId  = $nodeId
}

if ($Raw) {
  if ($null -ne $obj.NodeId) {
    Write-Output ("{0} {1}" -f $obj.FileKey, $obj.NodeId)
  }
  else {
    Write-Output ("{0}" -f $obj.FileKey)
  }
}
elseif ($Json) {
  $obj | ConvertTo-Json -Compress
}
else {
  $obj
}
