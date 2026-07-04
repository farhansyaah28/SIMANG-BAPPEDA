const { Client } = require('pg');

const connectionString = 'postgresql://postgres.hjbfegdqsnradtxdpdkz:kkpmagang1.@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres';

async function main() {
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Koneksi sukses!');

    // 1. Tampilkan jumlah row di audit_logs
    const countRes = await client.query('SELECT COUNT(*) FROM public.audit_logs;');
    console.log('Total baris di audit_logs:', countRes.rows[0].count);

    // 2. Tampilkan beberapa record terbaru
    const logsRes = await client.query('SELECT * FROM public.audit_logs ORDER BY created_at DESC LIMIT 5;');
    console.log('\n5 Record Terakhir:');
    logsRes.rows.forEach(log => {
      console.log(log);
    });

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

main();
