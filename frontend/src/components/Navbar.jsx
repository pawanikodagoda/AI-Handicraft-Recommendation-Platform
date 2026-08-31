import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function navClass({ isActive }) {
  return `relative px-2 py-1 transition-colors duration-300 group ${
    isActive ? 'text-brand-800 font-semibold' : 'text-wood/80 hover:text-brand-600 font-medium'
  }`
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line/60 bg-cream/80 backdrop-blur-xl shadow-sm transition-all duration-300">
      {/* Premium top announcement bar */}
      <div className="bg-brand-900 text-cream text-[10px] sm:text-xs font-medium py-1.5 px-4 text-center tracking-widest uppercase flex justify-center items-center gap-2">
        <span className="inline-block animate-pulse h-1.5 w-1.5 rounded-full bg-gold-400"></span>
        Free shipping on all orders over LKR 10,000
      </div>

      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-8">

        {/* Navigation Links */}
        <nav className="flex items-center gap-5 sm:gap-7 text-sm">
          <NavLink to="/products" className={navClass}>
            {({ isActive }) => (
              <>
                shop
                <span className={`absolute left-0 -bottom-1 h-[2px] bg-gold-400 transition-all duration-300 rounded-full ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </>
            )}
          </NavLink>

          {!user && (
            <div className="flex items-center gap-4 ml-2 border-l border-line/50 pl-6">
              <NavLink to="/login" className="text-brand-700 font-medium hover:text-gold-500 transition-colors">
                log in
              </NavLink>
              <Link to="/register" className="btn-primary !px-6 !py-2 text-sm !rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                sign up
              </Link>
            </div>
          )}

          {user?.role === 'customer' && (
            <>
              <NavLink to="/cart" className={navClass}>
                {({ isActive }) => (
                  <span className="flex items-center gap-1.5">
                    <i aria-hidden="true" className={`fa-solid fa-basket-shopping ${isActive ? 'text-gold-500' : 'text-wood/60 group-hover:text-gold-500 group-hover:-translate-y-0.5 transition-all duration-300'}`} />
                    cart
                    <span className={`absolute left-0 -bottom-1 h-[2px] bg-gold-400 transition-all duration-300 rounded-full ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                  </span>
                )}
              </NavLink>
              <NavLink to="/orders" className={navClass}>
                {({ isActive }) => (
                  <>
                    orders
                    <span className={`absolute left-0 -bottom-1 h-[2px] bg-gold-400 transition-all duration-300 rounded-full ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                  </>
                )}
              </NavLink>
            </>
          )}

          {user?.role === 'seller' && (
            <NavLink to="/seller" className={navClass}>
               {({ isActive }) => (
                  <span className="flex items-center gap-1.5">
                    <i aria-hidden="true" className={`fa-solid fa-store ${isActive ? 'text-gold-500' : 'text-wood/60 group-hover:text-gold-500 group-hover:rotate-6 transition-all duration-300'}`} />
                    my shop
                    <span className={`absolute left-0 -bottom-1 h-[2px] bg-gold-400 transition-all duration-300 rounded-full ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                  </span>
                )}
            </NavLink>
          )}

          {user?.role === 'admin' && (
            <NavLink to="/admin" className={navClass}>
               {({ isActive }) => (
                  <>
                    admin
                    <span className={`absolute left-0 -bottom-1 h-[2px] bg-gold-400 transition-all duration-300 rounded-full ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                  </>
                )}
            </NavLink>
          )}

          {user && (
            <div className="flex items-center gap-4 ml-2 border-l border-line/50 pl-6">
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-2 text-wood/80 transition-colors hover:text-red-500 font-medium group"
              >
                <i aria-hidden="true" className="fa-solid fa-arrow-right-from-bracket group-hover:-translate-x-1 transition-transform"></i>
                log out
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
