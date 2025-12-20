# FurniPrice API Documentation

Dokumentasi lengkap API untuk integrasi sistem FurniPrice dengan aplikasi atau sistem lain.

## 📋 Daftar Isi

- [Autentikasi](#autentikasi)
- [Base URL](#base-url)
- [Response Format](#response-format)
- [Endpoints](#endpoints)
  - [Products](#products)
  - [Product Regions](#product-regions)
  - [Customers](#customers)
  - [Customer Pricing Tiers](#customer-pricing-tiers)
  - [Price History](#price-history)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Contoh Integrasi](#contoh-integrasi)

---

## Autentikasi

API FurniPrice menggunakan Supabase sebagai backend. Untuk mengakses API, Anda memerlukan:

| Key | Deskripsi |
|-----|-----------|
| `SUPABASE_URL` | URL project Supabase |
| `SUPABASE_ANON_KEY` | Public anon key untuk akses API |

### Header yang Diperlukan

```http
apikey: YOUR_SUPABASE_ANON_KEY
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
Content-Type: application/json
```

---

## Base URL

```
https://nwaondjaxegqlqtvsgqf.supabase.co/rest/v1
```

---

## Response Format

### Success Response

```json
{
  "data": [...],
  "status": 200
}
```

### Error Response

```json
{
  "message": "Error description",
  "code": "ERROR_CODE",
  "hint": "Suggestion to fix",
  "details": "Additional details"
}
```

---

## Endpoints

### Products

Manajemen data produk furniture.

#### Get All Products

```http
GET /products
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `select` | string | Kolom yang ingin diambil (default: *) |
| `order` | string | Urutan data (e.g., `name.asc`) |
| `limit` | integer | Batas jumlah data |
| `offset` | integer | Offset untuk pagination |

**Example Request:**

```bash
curl -X GET "https://nwaondjaxegqlqtvsgqf.supabase.co/rest/v1/products?select=*&order=name.asc" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Example Response:**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Sofa Minimalis 3 Seater",
    "category": "Sofa",
    "base_price": 5500000,
    "unit": "unit",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

#### Get Product by ID

```http
GET /products?id=eq.{product_id}
```

**Example Request:**

```bash
curl -X GET "https://nwaondjaxegqlqtvsgqf.supabase.co/rest/v1/products?id=eq.550e8400-e29b-41d4-a716-446655440000" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

#### Get Products by Category

```http
GET /products?category=eq.{category_name}
```

**Example Request:**

```bash
curl -X GET "https://nwaondjaxegqlqtvsgqf.supabase.co/rest/v1/products?category=eq.Sofa" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

#### Create Product

```http
POST /products
```

**Request Body:**

```json
{
  "name": "Meja Makan Kayu Jati",
  "category": "Meja",
  "base_price": 3500000,
  "unit": "unit"
}
```

**Example Request:**

```bash
curl -X POST "https://nwaondjaxegqlqtvsgqf.supabase.co/rest/v1/products" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name": "Meja Makan Kayu Jati", "category": "Meja", "base_price": 3500000, "unit": "unit"}'
```

#### Update Product

```http
PATCH /products?id=eq.{product_id}
```

**Request Body:**

```json
{
  "base_price": 3750000
}
```

**Example Request:**

```bash
curl -X PATCH "https://nwaondjaxegqlqtvsgqf.supabase.co/rest/v1/products?id=eq.550e8400-e29b-41d4-a716-446655440000" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"base_price": 3750000}'
```

#### Delete Product

```http
DELETE /products?id=eq.{product_id}
```

**Example Request:**

```bash
curl -X DELETE "https://nwaondjaxegqlqtvsgqf.supabase.co/rest/v1/products?id=eq.550e8400-e29b-41d4-a716-446655440000" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

### Product Regions

Harga produk per region/wilayah.

#### Get Product Regions

```http
GET /product_regions?product_id=eq.{product_id}
```

**Example Response:**

```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "product_id": "550e8400-e29b-41d4-a716-446655440000",
    "region_name": "Jakarta",
    "price": 5800000,
    "created_at": "2024-01-15T10:30:00Z"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440002",
    "product_id": "550e8400-e29b-41d4-a716-446655440000",
    "region_name": "Surabaya",
    "price": 6000000,
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

#### Create Product Region

```http
POST /product_regions
```

**Request Body:**

```json
{
  "product_id": "550e8400-e29b-41d4-a716-446655440000",
  "region_name": "Bandung",
  "price": 5700000
}
```

#### Update Product Region Price

```http
PATCH /product_regions?id=eq.{region_id}
```

**Request Body:**

```json
{
  "price": 5900000
}
```

---

### Customers

Manajemen data pelanggan.

#### Get All Customers

```http
GET /customers
```

**Example Response:**

```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "name": "PT Furniture Indonesia",
    "address": "Jl. Sudirman No. 123, Jakarta",
    "phone": "021-5551234",
    "email": "contact@furniture-id.com",
    "notes": "Pelanggan VIP",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

#### Create Customer

```http
POST /customers
```

**Request Body:**

```json
{
  "name": "Toko Mebel Sejahtera",
  "address": "Jl. Raya Bogor No. 45",
  "phone": "081234567890",
  "email": "mebel.sejahtera@email.com",
  "notes": "Pelanggan baru"
}
```

#### Update Customer

```http
PATCH /customers?id=eq.{customer_id}
```

#### Delete Customer

```http
DELETE /customers?id=eq.{customer_id}
```

---

### Customer Pricing Tiers

Tier diskon khusus per pelanggan.

#### Get Customer Pricing Tiers

```http
GET /customer_pricing_tiers?customer_id=eq.{customer_id}
```

**Example Response:**

```json
[
  {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "customer_id": "770e8400-e29b-41d4-a716-446655440000",
    "tier_name": "Gold",
    "discount_percentage": 15,
    "description": "Diskon khusus pelanggan Gold",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

#### Create Pricing Tier

```http
POST /customer_pricing_tiers
```

**Request Body:**

```json
{
  "customer_id": "770e8400-e29b-41d4-a716-446655440000",
  "tier_name": "Platinum",
  "discount_percentage": 20,
  "description": "Diskon eksklusif pelanggan Platinum"
}
```

---

### Price History

Riwayat kalkulasi harga.

#### Get Price History

```http
GET /price_history?order=created_at.desc
```

**Query Parameters untuk Filter:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `customer_id` | eq.{uuid} | Filter by customer |
| `product_name` | ilike.*{name}* | Search by product name |
| `created_at` | gte.{date} | Filter by date (from) |
| `created_at` | lte.{date} | Filter by date (to) |

**Example Response:**

```json
[
  {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "product_name": "Sofa Minimalis 3 Seater",
    "product_unit": "unit",
    "base_price": 5500000,
    "region_name": "Jakarta",
    "region_price": 5800000,
    "margin_type": "percentage",
    "margin_amount": 20,
    "net_price": 6960000,
    "discounts": [
      {"type": "percentage", "value": 10, "amount": 696000}
    ],
    "final_price": 6264000,
    "customer_id": "770e8400-e29b-41d4-a716-446655440000",
    "notes": "Penawaran khusus Q1 2024",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

#### Create Price History Record

```http
POST /price_history
```

**Request Body:**

```json
{
  "product_name": "Meja Makan Kayu Jati",
  "product_unit": "unit",
  "base_price": 3500000,
  "region_name": "Jakarta",
  "region_price": 3700000,
  "margin_type": "percentage",
  "margin_amount": 25,
  "net_price": 4625000,
  "discounts": [],
  "final_price": 4625000,
  "customer_id": "770e8400-e29b-41d4-a716-446655440000",
  "notes": "Harga normal tanpa diskon"
}
```

---

## Error Handling

### Common Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | `PGRST100` | Invalid request syntax |
| 401 | `PGRST301` | Missing or invalid API key |
| 403 | `PGRST302` | Insufficient permissions |
| 404 | `PGRST116` | Resource not found |
| 409 | `23505` | Unique constraint violation |
| 500 | `PGRST500` | Internal server error |

### Error Response Example

```json
{
  "code": "23505",
  "details": "Key (name)=(Sofa Minimalis) already exists.",
  "hint": null,
  "message": "duplicate key value violates unique constraint \"products_name_key\""
}
```

---

## Rate Limiting

- **Default limit**: 1000 requests per hour
- **Burst limit**: 100 requests per second

Header response untuk rate limit:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1704067200
```

---

## Contoh Integrasi

### JavaScript/TypeScript (menggunakan Supabase Client)

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://nwaondjaxegqlqtvsgqf.supabase.co',
  'YOUR_ANON_KEY'
)

// Get all products
const { data: products, error } = await supabase
  .from('products')
  .select('*')
  .order('name', { ascending: true })

// Get products with regions
const { data: productsWithRegions } = await supabase
  .from('products')
  .select(`
    *,
    product_regions (*)
  `)

// Create new product
const { data: newProduct, error } = await supabase
  .from('products')
  .insert({
    name: 'Kursi Tamu Set',
    category: 'Kursi',
    base_price: 4500000,
    unit: 'set'
  })
  .select()
  .single()

// Update product
const { data, error } = await supabase
  .from('products')
  .update({ base_price: 4750000 })
  .eq('id', 'product-uuid')
  .select()

// Delete product
const { error } = await supabase
  .from('products')
  .delete()
  .eq('id', 'product-uuid')
```

### Python

```python
from supabase import create_client, Client

url = "https://nwaondjaxegqlqtvsgqf.supabase.co"
key = "YOUR_ANON_KEY"
supabase: Client = create_client(url, key)

# Get all products
response = supabase.table('products').select("*").execute()
products = response.data

# Get products by category
response = supabase.table('products').select("*").eq('category', 'Sofa').execute()

# Create product
response = supabase.table('products').insert({
    "name": "Lemari Pakaian 3 Pintu",
    "category": "Lemari",
    "base_price": 2800000,
    "unit": "unit"
}).execute()

# Update product
response = supabase.table('products').update({
    "base_price": 3000000
}).eq('id', 'product-uuid').execute()

# Delete product
response = supabase.table('products').delete().eq('id', 'product-uuid').execute()
```

### PHP

```php
<?php
require 'vendor/autoload.php';

use Supabase\CreateClient;

$supabase = new CreateClient(
    'https://nwaondjaxegqlqtvsgqf.supabase.co',
    'YOUR_ANON_KEY'
);

// Get all products
$products = $supabase->from('products')
    ->select('*')
    ->execute();

// Create product
$newProduct = $supabase->from('products')
    ->insert([
        'name' => 'Rak TV Minimalis',
        'category' => 'TV Stand',
        'base_price' => 1500000,
        'unit' => 'unit'
    ])
    ->execute();
```

### cURL

```bash
# Get all products
curl -X GET "https://nwaondjaxegqlqtvsgqf.supabase.co/rest/v1/products?select=*" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Create product
curl -X POST "https://nwaondjaxegqlqtvsgqf.supabase.co/rest/v1/products" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name": "Tempat Tidur King Size", "category": "Tempat Tidur", "base_price": 8500000, "unit": "unit"}'
```

---

## Webhook Integration

Untuk integrasi real-time, Anda dapat menggunakan Supabase Realtime:

```typescript
const subscription = supabase
  .channel('products-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'products' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
```

---

## Kategori Produk

Kategori yang tersedia dalam sistem:

| Kategori | Icon | Deskripsi |
|----------|------|-----------|
| Sofa | 🛋️ | Sofa dan kursi malas |
| Kursi | 🪑 | Kursi makan, tamu, kantor |
| Tempat Tidur | 🛏️ | Ranjang dan kasur |
| Meja | 🪑 | Meja makan, kerja, tamu |
| Lemari | 🚪 | Lemari pakaian, dapur |
| Lampu | 💡 | Lampu hias dan penerangan |
| Rak Buku | 📚 | Rak dan shelving |
| TV Stand | 📺 | Meja dan rak TV |
| Kamar Mandi | 🛁 | Perlengkapan kamar mandi |
| Dapur | 🍴 | Perlengkapan dapur |

---

## Support

Untuk pertanyaan atau bantuan teknis:
- Buat issue di repository GitHub
- Email: support@furniprice.com

---

<div align="center">
  <strong>FurniPrice API v1.0</strong><br>
  Last updated: Desember 2024
</div>
