import Header from './Header'
import AutoScrollBanner from './AutoScrollBanner';
import Footer from './Footer'
import DotGrid from '../blocks/Backgrounds/DotGrid/DotGrid'
import { useLocation } from 'react-router-dom'

const Layout = ({ children, cartCount, wishlistCount }) => {
  const location = useLocation()

  // Routes where you don't want the layout

  // Exclude admin-login and all /admin/* routes from layout
  const excludedRoutes = ['/profile', '/transactions', '/admin-login']
  const isAdminRoute = location.pathname.startsWith('/admin');
  if (excludedRoutes.includes(location.pathname) || isAdminRoute) return children

  return (
    <div className="layout-wrapper">
      <AutoScrollBanner />
      {/* Background Layer */}
      <div style={{ height: '100vh', position: 'fixed', inset: 0, zIndex: 0, width: '100%' }}>
        <DotGrid
          dotSize={2.5}
          gap={20}
          baseColor="#b19d8e"
          activeColor="#1c1c1c"
          proximity={120}
          shockRadius={250}
          shockStrength={5}
          resistance={500}
          returnDuration={3}
        />
      </div>
      <Header cartCount={cartCount} wishlistCount={wishlistCount} />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default Layout
