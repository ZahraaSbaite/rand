<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>{{ $heading }}</title>
</head>
{{-- Email clients ignore stylesheets, so every style is inline and the layout is tables. --}}
<body style="margin:0; padding:0; background:#F3E3B5; color:#1F2A44; font-family:Arial, Helvetica, sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3E3B5;">
    <tr>
        <td align="center" style="padding:32px 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
                <tr>
                    <td style="padding:0 4px 16px; font-family:Georgia, 'Times New Roman', serif; font-size:28px; font-weight:bold; color:#7A1F2E;">
                        strand
                    </td>
                </tr>
                <tr>
                    <td style="background:#FBF0D8; border:2px solid #1F2A44; border-radius:20px; padding:28px 28px 24px;">
                        <p style="margin:0 0 6px; font-size:13px; font-weight:bold; letter-spacing:0.04em; text-transform:uppercase; color:#3D4766;">
                            Order #{{ $order->id }} &middot; Step {{ $step }} of {{ $steps }}: {{ $stageLabel }}
                        </p>
                        <h1 style="margin:0 0 12px; font-family:Georgia, 'Times New Roman', serif; font-size:26px; line-height:1.25; color:#1F2A44;">
                            {{ $heading }}
                        </h1>
                        <p style="margin:0 0 22px; font-size:16px; line-height:1.55;">
                            {{ $body }}
                        </p>

                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; font-size:15px;">
                            @foreach ($items as $item)
                                <tr>
                                    <td style="padding:8px 0; border-bottom:1px solid #E5D3A3;">
                                        {{ $item['name'] }} &times; {{ $item['quantity'] }}
                                    </td>
                                    <td align="right" style="padding:8px 0; border-bottom:1px solid #E5D3A3; white-space:nowrap;">
                                        {{ $item['total'] }}
                                    </td>
                                </tr>
                            @endforeach
                            <tr>
                                <td style="padding:12px 0 0; font-weight:bold;">Total (cash on delivery)</td>
                                <td align="right" style="padding:12px 0 0; font-weight:bold; white-space:nowrap;">{{ $total }}</td>
                            </tr>
                        </table>

                        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 4px;">
                            <tr>
                                <td style="border-radius:999px; background:#7A1F2E;">
                                    <a href="{{ $trackUrl }}" style="display:inline-block; padding:13px 26px; font-size:15px; font-weight:bold; color:#FBF0D8; text-decoration:none;">
                                        Track your order
                                    </a>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="padding:18px 6px 0; font-size:13px; line-height:1.5; color:#3D4766;">
                        Questions about your order? Just reply to this email.<br>
                        Delivering to: {{ $order->customer_address }}
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
