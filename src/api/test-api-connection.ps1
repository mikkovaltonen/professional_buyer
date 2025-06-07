# Test API connection script with detailed error handling

$apiUrl = "https://scmbp.com/REST/v1/genaibase/kemppi_Kemppi_100_FG_sales_m_assistant_input_forecasts_separated"
$authToken = $env:VITE_API_BEARER_TOKEN

if (-not $authToken) {
    Write-Host "Error: VITE_API_BEARER_TOKEN environment variable is not set" -ForegroundColor Red
    Write-Host "Please set it using: `$env:VITE_API_BEARER_TOKEN = 'your-token-here'" -ForegroundColor Yellow
    exit 1
}

Write-Host "Testing API connection to: $apiUrl"

try {
    # Test GET request with detailed error handling
    Write-Host "`nSending GET request..."
    $response = curl -X GET $apiUrl `
        -H "Accept: application/json" `
        -H "Content-Type: application/json" `
        -H "Authorization: Bearer $authToken" `
        -v

    Write-Host "`nResponse Status Code: $($response.StatusCode)"
    Write-Host "Response Headers:"
    $response.Headers | Format-Table -AutoSize
    
    Write-Host "`nResponse Body:"
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10

} catch {
    Write-Host "`nError occurred:" -ForegroundColor Red
    Write-Host "Error Message: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Error Type: $($_.Exception.GetType().FullName)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        Write-Host "`nResponse Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
        Write-Host "Response Status Description: $($_.Exception.Response.StatusDescription)" -ForegroundColor Yellow
        
        # Try to get response body if available
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            Write-Host "`nResponse Body:" -ForegroundColor Yellow
            Write-Host $responseBody
        } catch {
            Write-Host "Could not read response body: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Additional connection test with Invoke-WebRequest
Write-Host "`nTesting connection with Invoke-WebRequest..."
try {
    $webRequest = Invoke-WebRequest -Uri $apiUrl -Method GET -Headers @{
        "Accept" = "application/json"
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $authToken"
    } -UseBasicParsing

    Write-Host "Connection successful!" -ForegroundColor Green
    Write-Host "Status Code: $($webRequest.StatusCode)"
    Write-Host "Response Length: $($webRequest.RawContentLength) bytes"
} catch {
    Write-Host "Connection failed:" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
} 