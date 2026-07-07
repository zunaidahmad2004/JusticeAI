$downloads = "$env:USERPROFILE\Downloads"
$dest = "C:\Users\hp\OneDrive\Desktop\JusticeAI-PRD\justice-ai\server\gemini-credentials.json"

$file = Get-ChildItem $downloads -Filter "gen-lang-client*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($file) {
    Copy-Item $file.FullName $dest -Force
    Write-Host "SUCCESS: Copied $($file.Name) to server folder"
} else {
    Write-Host "NOT FOUND — looking for any JSON in Downloads..."
    Get-ChildItem $downloads -Filter "*.json" | Select-Object Name, LastWriteTime
}
