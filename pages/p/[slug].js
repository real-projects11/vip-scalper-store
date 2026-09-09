import { useEffect, useState } from 'react';
import Head from 'next/head';
import ProductLanding from '../../components/ProductLanding';
import { getProduct } from '../../lib/products';

export async function getServerSideProps({ params }) {
  const product = await getProduct(params.slug);
  if (!product || !product.active) return { notFound: true };
  return { props: { product } };
}

export default function ProductPage({ product }) {
  useEffect(() => {
    window.__VIP_PRODUCT_ID__ = product.slug;
    const s1 = document.createElement('script');
    s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    s1.onload = () => {
      const s2 = document.createElement('script');
      s2.src = '/buy-modal.js';
      document.body.appendChild(s2);
    };
    document.body.appendChild(s1);
    return () => { document.body.removeChild(s1); };
  }, [product.slug]);

  return (
    <>
      <Head>
        <title>{product.title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight: '100dvh', background: '#e8e8e8', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <ProductLanding content={product} editable={false} mode="live" onChange={() => {}} />
      </div>
    </>
  );
}
