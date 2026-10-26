{!! $heading !!}

Order #{!! $order->id !!} · Step {!! $step !!} of {!! $steps !!}: {!! $stageLabel !!}

{!! $body !!}

@foreach ($items as $item)
- {!! $item['name'] !!} × {!! $item['quantity'] !!}: {!! $item['total'] !!}
@if ($item['note'])
  Your message: {!! $item['note'] !!}
@endif
@endforeach
- {!! $deliveryLabel !!}{!! $deliveryEta ? " (usually {$deliveryEta})" : '' !!}: {!! $deliveryFee !!}

{!! $totalLabel !!}: {!! $total !!}
@if ($bankDetails !== '')

Bank transfer details:
{!! $bankDetails !!}
Reference: Order #{!! $order->id !!}
@endif

Track your order: {!! $trackUrl !!}

Questions about your order? Just reply to this email.
Delivering to: {!! $order->customer_address !!}

Strand
