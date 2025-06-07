# Example of making REST API calls using cURL in PowerShell

# GET request example
$getResponse = curl -X GET "https://jsonplaceholder.typicode.com/posts/1" -H "Accept: application/json"
Write-Host "GET Response:"
$getResponse | ConvertFrom-Json | ConvertTo-Json

# POST request example
$postData = @{
    title = "Test Post"
    body = "This is a test post"
    userId = 1
} | ConvertTo-Json

$postResponse = curl -X POST "https://jsonplaceholder.typicode.com/posts" `
    -H "Content-Type: application/json" `
    -H "Accept: application/json" `
    -d $postData
Write-Host "`nPOST Response:"
$postResponse | ConvertFrom-Json | ConvertTo-Json

# PUT request example
$putData = @{
    id = 1
    title = "Updated Post"
    body = "This post has been updated"
    userId = 1
} | ConvertTo-Json

$putResponse = curl -X PUT "https://jsonplaceholder.typicode.com/posts/1" `
    -H "Content-Type: application/json" `
    -H "Accept: application/json" `
    -d $putData
Write-Host "`nPUT Response:"
$putResponse | ConvertFrom-Json | ConvertTo-Json

# DELETE request example
$deleteResponse = curl -X DELETE "https://jsonplaceholder.typicode.com/posts/1" `
    -H "Accept: application/json"
Write-Host "`nDELETE Response:"
$deleteResponse | ConvertFrom-Json | ConvertTo-Json 