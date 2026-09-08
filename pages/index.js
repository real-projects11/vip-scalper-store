import { useEffect, useState } from 'react';
import Head from 'next/head';
import ProductLanding from '../components/ProductLanding';
import { getContent } from '../lib/product-content';

export async function getServerSideProps() {
  const content = await getContent();
  return { props: { content } };
}

export default function Home({ content }) {
  const [scriptsReady, setScriptsReady] = useState(false);

  useEffect(() => {
    const s1 = document.createElement('script');
    s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    s1.onload = () => {
      const s2 = document.createElement('script');
      s2.src = '/buy-modal.js';
      s2.onload = () => setScriptsReady(true);
      document.body.appendChild(s2);
    };
    document.body.appendChild(s1);
    return () => {
      document.body.removeChild(s1);
    };
  }, []);

  return (
    <>
      <Head>
        <title>{content.title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight: '100dvh', background: '#e8e8e8', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <ProductLanding content={content} editable={false} mode="live" onChange={() => {}} />
      </div>
    </>
  );
}
