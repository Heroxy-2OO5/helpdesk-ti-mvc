param(
    [string]$ApiUrl = "http://localhost:3000/api"
)

$ErrorActionPreference = "Stop"
$results = @()

function Add-TestResult {
    param(
        [string]$Id,
        [string]$Test,
        [int]$Expected,
        [int]$Actual
    )

    $status = if ($Expected -eq $Actual) {
        "APROBADO"
    }
    else {
        "FALLIDO"
    }

    $script:results += [PSCustomObject]@{
        Id        = $Id
        Prueba    = $Test
        Esperado  = $Expected
        Obtenido  = $Actual
        Estado    = $status
    }
}

function Invoke-StatusRequest {
    param(
        [string]$Method,
        [string]$Uri,
        [object]$Body = $null,
        [string]$Token = ""
    )

    $requestParameters = @{
        Uri         = $Uri
        Method      = $Method
        ErrorAction = "Stop"
        UseBasicParsing = $true
    }

    if ($Token) {
        $requestParameters.Headers = @{
            Authorization = "Bearer $Token"
        }
    }

    if ($null -ne $Body) {
        $requestParameters.ContentType =
            "application/json"

        $requestParameters.Body =
            $Body | ConvertTo-Json -Depth 10
    }

    try {
        $response = Invoke-WebRequest @requestParameters
        return [int]$response.StatusCode
    }
    catch {
        if ($null -ne $_.Exception.Response) {
            return [int]$_.Exception.Response.StatusCode
        }

        throw
    }
}

function New-TestSession {
    param(
        [string]$Email,
        [string]$Password
    )

    $body = @{
        correo     = $Email
        contrasena = $Password
    } | ConvertTo-Json

    return Invoke-RestMethod `
        -Uri "$ApiUrl/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body `
        -UseBasicParsing
}

Write-Output "HelpDesk TI - Pruebas de seguridad"
Write-Output "API: $ApiUrl"
Write-Output ""

try {
    $adminSession = New-TestSession `
        -Email "admin@helpdesk.local" `
        -Password "Admin123*"

    $technicianSession = New-TestSession `
        -Email "tecnico@helpdesk.local" `
        -Password "Tecnico123*"

    $requesterSession = New-TestSession `
        -Email "solicitante@helpdesk.local" `
        -Password "Solicitante123*"

    Add-TestResult `
        -Id "SEG-01" `
        -Test "Login de administrador" `
        -Expected 200 `
        -Actual $(if ($adminSession.token) { 200 } else { 0 })

    Add-TestResult `
        -Id "SEG-02" `
        -Test "Login de tecnico" `
        -Expected 200 `
        -Actual $(if ($technicianSession.token) { 200 } else { 0 })

    Add-TestResult `
        -Id "SEG-03" `
        -Test "Login de solicitante" `
        -Expected 200 `
        -Actual $(if ($requesterSession.token) { 200 } else { 0 })

    $status = Invoke-StatusRequest `
        -Method "POST" `
        -Uri "$ApiUrl/auth/login" `
        -Body @{
            correo = "admin@helpdesk.local"
            contrasena = "incorrecta"
        }

    Add-TestResult `
        -Id "SEG-04" `
        -Test "Credenciales incorrectas" `
        -Expected 401 `
        -Actual $status

    $status = Invoke-StatusRequest `
        -Method "GET" `
        -Uri "$ApiUrl/users"

    Add-TestResult `
        -Id "SEG-05" `
        -Test "Ruta privada sin token" `
        -Expected 401 `
        -Actual $status

    $status = Invoke-StatusRequest `
        -Method "GET" `
        -Uri "$ApiUrl/users" `
        -Token "token-invalido"

    Add-TestResult `
        -Id "SEG-06" `
        -Test "Ruta privada con token invalido" `
        -Expected 401 `
        -Actual $status

    $status = Invoke-StatusRequest `
        -Method "GET" `
        -Uri "$ApiUrl/users" `
        -Token $requesterSession.token

    Add-TestResult `
        -Id "SEG-07" `
        -Test "Solicitante consulta usuarios" `
        -Expected 403 `
        -Actual $status

    $status = Invoke-StatusRequest `
        -Method "POST" `
        -Uri "$ApiUrl/categories" `
        -Body @{
            nombre = ""
            descripcion = "Intento no autorizado"
        } `
        -Token $technicianSession.token

    Add-TestResult `
        -Id "SEG-08" `
        -Test "Tecnico intenta crear una categoria" `
        -Expected 403 `
        -Actual $status

    $status = Invoke-StatusRequest `
        -Method "GET" `
        -Uri "$ApiUrl/users?page=1&limit=1" `
        -Token $adminSession.token

    Add-TestResult `
        -Id "SEG-09" `
        -Test "Administrador consulta usuarios" `
        -Expected 200 `
        -Actual $status

    $status = Invoke-StatusRequest `
        -Method "GET" `
        -Uri "$ApiUrl/tickets?page=1&limit=1" `
        -Token $requesterSession.token

    Add-TestResult `
        -Id "SEG-10" `
        -Test "Solicitante consulta sus tickets" `
        -Expected 200 `
        -Actual $status

    $status = Invoke-StatusRequest `
        -Method "GET" `
        -Uri "$ApiUrl/tickets?page=1&limit=1" `
        -Token $technicianSession.token

    Add-TestResult `
        -Id "SEG-11" `
        -Test "Tecnico consulta sus asignaciones" `
        -Expected 200 `
        -Actual $status

    $status = Invoke-StatusRequest `
        -Method "GET" `
        -Uri "$ApiUrl/metrics" `
        -Token $adminSession.token

    Add-TestResult `
        -Id "SEG-12" `
        -Test "Administrador consulta metricas" `
        -Expected 200 `
        -Actual $status

    $status = Invoke-StatusRequest `
        -Method "GET" `
        -Uri "$ApiUrl/metrics" `
        -Token $requesterSession.token

    Add-TestResult `
        -Id "SEG-13" `
        -Test "Solicitante consulta metricas" `
        -Expected 403 `
        -Actual $status
}
catch {
    Write-Error "No fue posible completar las pruebas: $($_.Exception.Message)"
    exit 1
}

$results | Format-Table -AutoSize

$failed = @(
    $results |
        Where-Object { $_.Estado -eq "FALLIDO" }
)

Write-Output ""
Write-Output "Total: $($results.Count)"
Write-Output "Aprobadas: $($results.Count - $failed.Count)"
Write-Output "Fallidas: $($failed.Count)"

if ($failed.Count -gt 0) {
    exit 1
}

exit 0