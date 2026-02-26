$uri = "http://localhost:8080/api/upload"
$filePath = "C:\Development\demos\hsi-reader\datasets\WHU-Hi-HongHu\WHU_Hi_HongHu.mat"

$result = Invoke-RestMethod -Uri $uri -Method Post -Form @{
    file = Get-Item $filePath
}

$result