$Port = 8080
$RootFolder = "C:\Users\User\.gemini\antigravity\scratch\csk-palestra"

Write-Host "Starting basic web server using System.Net.HttpListener..."
Write-Host "Site root is $RootFolder"
Write-Host "Listening on http://localhost:$Port/"
Write-Host "Press Ctrl+C to stop."

$Listener = New-Object System.Net.HttpListener
$Listener.Prefixes.Add("http://localhost:$Port/")
$Listener.Start()

try {
    while ($Listener.IsListening) {
        $Context = $Listener.GetContext()
        $Request = $Context.Request
        $Response = $Context.Response

        $UrlPath = $Request.Url.LocalPath.TrimStart('/')
        if ($UrlPath -eq "") {
            $UrlPath = "index.html"
        }
        
        $FilePath = Join-Path -Path $RootFolder -ChildPath $UrlPath

        if (Test-Path -Path $FilePath -PathType Leaf) {
            $Content = [System.IO.File]::ReadAllBytes($FilePath)
            $Response.ContentLength64 = $Content.Length
            
            # Basic mime types
            $Ext = [System.IO.Path]::GetExtension($FilePath).ToLower()
            $ContentType = "application/octet-stream"
            
            switch ($Ext) {
                ".html" { $ContentType = "text/html" }
                ".htm"  { $ContentType = "text/html" }
                ".css"  { $ContentType = "text/css" }
                ".js"   { $ContentType = "application/javascript" }
                ".png"  { $ContentType = "image/png" }
                ".jpg"  { $ContentType = "image/jpeg" }
                ".jpeg" { $ContentType = "image/jpeg" }
                ".gif"  { $ContentType = "image/gif" }
                ".svg"  { $ContentType = "image/svg+xml" }
                ".json" { $ContentType = "application/json" }
            }
            
            $Response.ContentType = $ContentType
            $Response.OutputStream.Write($Content, 0, $Content.Length)
            Write-Host "200 OK - $($Request.Url.LocalPath)"
        } else {
            $Response.StatusCode = 404
            Write-Host "404 Not Found - $($Request.Url.LocalPath)"
        }
        $Response.Close()
    }
}
finally {
    $Listener.Stop()
    $Listener.Close()
}
