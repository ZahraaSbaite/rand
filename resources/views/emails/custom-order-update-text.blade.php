{!! $heading !!}

Custom request #{!! $request->id !!} · {!! $label !!}

{!! $body !!}

{!! $piece !!} × {!! $request->quantity ?: 1 !!}
@if ($quote)
Price: {!! $quote['price'] !!}
@if ($quote['readyBy'])
Ready by: {!! $quote['readyBy'] !!}
@endif
@if ($quote['message'])

{!! $quote['message'] !!}
@endif
@endif

{!! $linkLabel !!}: {!! $statusUrl !!}

Questions about your piece? Just reply to this email.
@if ($request->shipping_address)
Delivering to: {!! $request->shipping_address !!}
@endif

Strand
