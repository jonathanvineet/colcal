import { ClerkProvider } from '@clerk/nextjs'
import '../index.css'
import '../App.css'

export default function MyApp({ Component, pageProps }) {
  return (
    <ClerkProvider>
      <Component {...pageProps} />
    </ClerkProvider>
  )
}