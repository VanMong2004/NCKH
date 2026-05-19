<!DOCTYPE html>
<html>
<body>

<h2>Analytics Report</h2>

<h3>Overview</h3>

<ul>
<li>Total Orders: {{$overview['total_orders']}}</li>
<li>Paid Orders: {{$overview['paid_orders']}}</li>
<li>Revenue: {{$overview['revenue']}}</li>
</ul>

<h3>Top Products</h3>

<table border="1" width="100%">
<tr>
<th>Name</th>
<th>Sold</th>
<th>Revenue</th>
</tr>

@foreach($top_products as $item)

<tr>
<td>{{$item['name']}}</td>
<td>{{$item['sold']}}</td>
<td>{{$item['revenue']}}</td>
</tr>

@endforeach

</table>

</body>
</html>