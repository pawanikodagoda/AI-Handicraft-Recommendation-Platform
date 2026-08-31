import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="relative z-10 mt-20 border-t border-line/40 bg-brand-900 text-cream pt-16 pb-8 overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-brand-800 opacity-50 blur-3xl mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-brand-800 opacity-30 blur-3xl mix-blend-screen pointer-events-none"></div>
      
      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          
          {/* Brand & Newsletter */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-block font-display text-4xl font-medium tracking-tight text-cream hover:text-gold-200 transition-colors">
              Cey<span className="font-light italic text-gold-400">Crafts</span>
            </Link>
            <p className="mt-4 text-sm text-brand-100 leading-relaxed max-w-sm">
              Discover unique, handcrafted bracelets from Sri Lankan artisans. 
              Elevate your style with pieces made with passion and precision.
            </p>
            
            <div className="mt-8">
              <h3 className="text-xs font-semibold text-gold-300 uppercase tracking-wider mb-3">Join our club</h3>
              <form className="flex max-w-md relative group">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="w-full bg-brand-800/80 border border-brand-700 rounded-full py-2.5 pl-4 pr-12 text-sm text-cream placeholder-brand-300 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400 transition-all duration-300"
                />
                <button 
                  type="button" 
                  className="absolute right-1.5 top-1.5 bottom-1.5 w-8 flex items-center justify-center rounded-full bg-brand-600 text-gold-200 hover:bg-gold-400 hover:text-brand-900 transition-all duration-300 shadow-sm"
                >
                  <i aria-hidden="true" className="fa-solid fa-arrow-right text-xs"></i>
                </button>
              </form>
            </div>
          </div>
          
          {/* Shop */}
          <div>
            <h3 className="text-xs font-semibold text-gold-300 uppercase tracking-wider mb-5">Shop</h3>
            <ul className="space-y-3.5">
              {['All Bracelets', 'New Arrivals', 'Bestsellers', 'Virtual Try-On', 'Gift Cards'].map((item) => (
                <li key={item}>
                  <Link to="/" className="text-sm text-brand-100 hover:text-gold-300 transition-all duration-300 flex items-center group">
                    <span className="w-0 overflow-hidden group-hover:w-3 transition-all duration-300 text-gold-400 text-xs flex-shrink-0">
                      <i aria-hidden="true" className="fa-solid fa-chevron-right"></i>
                    </span>
                    <span className="group-hover:translate-x-1 transition-transform duration-300 whitespace-nowrap">{item}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h3 className="text-xs font-semibold text-gold-300 uppercase tracking-wider mb-5">Support</h3>
            <ul className="space-y-3.5">
              {['Contact Us', 'FAQ', 'Shipping & Returns', 'Track Order', 'Size Guide'].map((item) => (
                <li key={item}>
                  <Link to="/" className="text-sm text-brand-100 hover:text-gold-300 transition-all duration-300 flex items-center group">
                    <span className="w-0 overflow-hidden group-hover:w-3 transition-all duration-300 text-gold-400 text-xs flex-shrink-0">
                      <i aria-hidden="true" className="fa-solid fa-chevron-right"></i>
                    </span>
                    <span className="group-hover:translate-x-1 transition-transform duration-300 whitespace-nowrap">{item}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Connect */}
          <div>
            <h3 className="text-xs font-semibold text-gold-300 uppercase tracking-wider mb-5">Connect</h3>
            <div className="flex gap-3 mb-6">
              {[
                { icon: 'instagram', link: '#' },
                { icon: 'facebook-f', link: '#' },
                { icon: 'pinterest-p', link: '#' },
                { icon: 'tiktok', link: '#' }
              ].map((social) => (
                <a 
                  key={social.icon} 
                  href={social.link} 
                  className="w-9 h-9 rounded-full bg-brand-800 border border-brand-700/50 flex items-center justify-center text-brand-200 hover:bg-gold-400 hover:text-brand-900 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                >
                  <i aria-hidden="true" className={`fa-brands fa-${social.icon}`}></i>
                </a>
              ))}
            </div>
            
            <div className="space-y-3 mt-8">
              <p className="text-xs text-brand-200 flex items-center group cursor-pointer transition-colors hover:text-gold-300">
                <i aria-hidden="true" className="fa-solid fa-location-dot w-5 text-gold-400 group-hover:scale-110 transition-transform"></i>
                Colombo, Sri Lanka
              </p>
              <p className="text-xs text-brand-200 flex items-center group cursor-pointer transition-colors hover:text-gold-300">
                <i aria-hidden="true" className="fa-solid fa-envelope w-5 text-gold-400 group-hover:scale-110 transition-transform"></i>
                hello@ceycrafts.com
              </p>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-brand-800/80 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-brand-300 order-3 md:order-1">
            &copy; {new Date().getFullYear()} CeyCrafts. All rights reserved.
          </p>
          
          <div className="flex gap-6 text-xs text-brand-300 order-2">
            <Link to="/" className="hover:text-gold-300 transition-colors">Privacy Policy</Link>
            <Link to="/" className="hover:text-gold-300 transition-colors">Terms of Service</Link>
          </div>
          
          <div className="flex gap-3 text-xl text-brand-400 order-1 md:order-3">
            <i aria-hidden="true" className="fa-brands fa-cc-visa hover:text-gold-400 transition-colors cursor-pointer" title="Visa"></i>
            <i aria-hidden="true" className="fa-brands fa-cc-mastercard hover:text-gold-400 transition-colors cursor-pointer" title="Mastercard"></i>
            <i aria-hidden="true" className="fa-brands fa-cc-amex hover:text-gold-400 transition-colors cursor-pointer" title="American Express"></i>
            <i aria-hidden="true" className="fa-brands fa-cc-paypal hover:text-gold-400 transition-colors cursor-pointer" title="PayPal"></i>
          </div>
        </div>
      </div>
    </footer>
  )
}
