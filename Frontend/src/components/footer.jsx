import React from 'react'

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="max-w-7xl mx-auto px-4 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <div>
                    <div className="text-lg font-semibold text-white">LearnSphere</div>
                    <p className="text-sm mt-3 text-gray-400">
                        A modern LMS for students, educators, and organizations.
                    </p>
                </div>
                <div>
                    <h4 className="text-white font-medium mb-3">Product</h4>
                    <ul className="space-y-2 text-sm">
                        <li>Features</li>
                        <li>Pricing</li>
                        <li>Updates</li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-medium mb-3">Company</h4>
                    <ul className="space-y-2 text-sm">
                        <li>About</li>
                        <li>Careers</li>
                        <li>Contact</li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-medium mb-3">Support</h4>
                    <ul className="space-y-2 text-sm">
                        <li>Help Center</li>
                        <li>Privacy Policy</li>
                        <li>Terms</li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-white/10 py-4 text-center text-sm text-gray-500">
                © {new Date().getFullYear()} LearnSphere. All rights reserved.
            </div>
        </footer>
    )
}

export default Footer
