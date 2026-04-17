'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Users, Award, Clock, Star, CheckCircle, Phone, Mail, MapPin } from 'lucide-react';

export default function BrandPage() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);

  const handleScanQR = () => {
    setIsScanning(true);
    // In a real app, this would open camera for QR scanning
    // For now, we'll just show a message
    alert('Please scan the QR code on your table to access the menu');
    setIsScanning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#0476b1' }}>Hotel 360</h1>
            <p className="text-slate-600">Intelligent Tools for Modern Hotel Management</p>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Your Partner in Smarter Hospitality Solutions
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            At Cogwave, we're passionate about transforming hospitality through technology 
            that's intuitive, flexible, and built to scale. With our proprietary platform, 
            HOTEL 360, we help hotels, resorts, and restaurants streamline their operations 
            and deliver seamless guest experiences.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <div className="text-3xl font-bold mb-2" style={{ color: '#0476b1' }}>6000+</div>
            <div className="text-slate-600">Total Clients</div>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <div className="text-3xl font-bold mb-2" style={{ color: '#0476b1' }}>20+</div>
            <div className="text-slate-600">Years in Business</div>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <div className="text-3xl font-bold mb-2" style={{ color: '#0476b1' }}>28K+</div>
            <div className="text-slate-600">Daily Check-ins</div>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <div className="text-3xl font-bold mb-2" style={{ color: '#0476b1' }}>100%</div>
            <div className="text-slate-600">Satisfied Clients</div>
          </div>
        </div>

        {/* Journey Timeline */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-12">
          <h3 className="text-2xl font-bold text-slate-900 mb-8 text-center">The Journey of Innovation</h3>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f0f7fc' }}>
                <span className="font-bold" style={{ color: '#0476b1' }}>2005</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Foundation & Product Development</h4>
                <p className="text-slate-600">
                  Cogwave Software Technologies was founded in Bangalore, India, aiming to transform 
                  hotel management with robust software solutions.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f0f7fc' }}>
                <span className="font-bold" style={{ color: '#0476b1' }}>2019</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Cloud & Touch-Free Solutions</h4>
                <p className="text-slate-600">
                  Introduced cloud-based PMS solutions and touch-free solutions including mobile 
                  check-ins, digital menus, and contactless ordering.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f0f7fc' }}>
                <span className="font-bold" style={{ color: '#0476b1' }}>2025</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Strategic Rebranding to Hotel 360</h4>
                <p className="text-slate-600">
                  Rebranded as Hotel 360 with modern tech stack (Angular, Azure Cloud, SaaS) 
                  and comprehensive 360-degree approach to hotel management.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-12">
          <h3 className="text-2xl font-bold text-slate-900 mb-8 text-center">Our Services</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              'Front Office Management',
              'Central Reservation System',
              'House Keeping Management',
              'Point Of Sales',
              'Material Management',
              'HR & Payroll System',
              'Banquet Management',
              'Channel Manager',
              'Maintenance'
            ].map((service, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-slate-700 text-sm">{service}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leadership Team */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-12">
          <h3 className="text-2xl font-bold text-slate-900 mb-8 text-center">Leadership Team</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#f0f7fc' }}>
                <Users className="w-10 h-10" style={{ color: '#0476b1' }} />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Murali Rajaram</h4>
              <p className="text-sm mb-2" style={{ color: '#0476b1' }}>Founder & CTO</p>
              <p className="text-slate-600 text-sm">
                20+ years of experience in Hospitality Tech solutions, architecting 
                the platform from the ground up.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#f0f7fc' }}>
                <Award className="w-10 h-10" style={{ color: '#0476b1' }} />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Sundareshan Jayaram</h4>
              <p className="text-sm mb-2" style={{ color: '#0476b1' }}>Chief Advisor</p>
              <p className="text-slate-600 text-sm">
                25+ years of distinguished experience in the hospitality industry 
                with unparalleled industry knowledge.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#f0f7fc' }}>
                <Star className="w-10 h-10" style={{ color: '#0476b1' }} />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Pradeep Srinivasan</h4>
              <p className="text-sm mb-2" style={{ color: '#0476b1' }}>Strategic Advisor and BD Head</p>
              <p className="text-slate-600 text-sm">
                24+ years of experience in business development, GTM & scaling businesses.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-12">
          <h3 className="text-2xl font-bold text-slate-900 mb-8 text-center">Contact Us</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Get in Touch</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5" style={{ color: '#0476b1' }} />
                  <span className="text-slate-600">(+91)-804-1710-121</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5" style={{ color: '#0476b1' }} />
                  <span className="text-slate-600">enquiry@cogwave.in</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5" style={{ color: '#0476b1' }} />
                  <span className="text-slate-600">
                    Srirama Plaza, No.158/4, 2nd Floor, DVG Road,<br />
                    Basavanagudi, Bengaluru - 560004
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Our Presence</h4>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" style={{ color: '#0476b1' }} />
                <span className="text-slate-600">Bangalore, Hyderabad, & Goa</span>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="rounded-2xl p-8 text-center text-white" style={{ background: 'linear-gradient(to right, #0476b1, #035a87)' }}>
          <h3 className="text-2xl font-bold mb-4">Ready to Experience Smart Hospitality?</h3>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Scan the QR code on your table to access our digital menu and enjoy 
            a seamless dining experience powered by Hotel 360 technology.
          </p>
          <button
            onClick={handleScanQR}
            disabled={isScanning}
            className="bg-white px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2 mx-auto disabled:opacity-50"
            style={{ color: '#0476b1' }}
          >
            {isScanning ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: '#0476b1' }}></div>
                Scanning...
              </>
            ) : (
              <>
                Scan QR Code for Menu
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

