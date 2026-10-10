{!! $heading !!}

Order #{!! $order->id !!} · Step {!! $step !!} of {!! $steps !!}: {!! $stageLabel !!}

{!! $body !!}

@foreach ($items as $item)
- {!! $item['name'] !!} × {!! $item['quantity'] !!}: {!! $item['total'] !!}
@endforeach

Total (cash on delivery): {!! $total !!}

Track your order: {!! $trackUrl !!}

Questions about your order? Just reply to this email.
Delivering to: {!! $order->customer_address !!}

Strand
