import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, ChevronLeft, Send, CheckCircle, 
  Upload
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Submission, WebsiteType, DesignStyle } from '../types';
import { saveSubmission } from '../lib/store';

const generateId = () => Math.random().toString(36).substring(2, 11);

const TOTAL_STEPS = 7;

export default function ClientForm() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState<Partial<Submission>>({
    businessName: '',
    ownerName: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    websiteType: 'Business Website',
    onlineOrdering: false,
    whatsappIntegration: false,
    googleMaps: false,
    colors: '',
    designStyle: 'Modern',
    exampleLinks: '',
    designNotes: '',
    logo: '',
    brandDescription: '',
    tagline: '',
    aboutBusiness: '',
    services: '',
    workingHours: '',
    socialMedia: '',
    specialFeatures: '',
    extraNotes: ''
  });

  const nextStep = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        alert("Please upload an image smaller than 500KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (step < TOTAL_STEPS) {
      nextStep();
      return;
    }

    setIsSubmitting(true);
    try {
      const submission: Submission = {
        ...(formData as Submission),
        id: generateId(),
        createdAt: new Date().toISOString(),
        status: 'New'
      };

      await saveSubmission(submission);
      
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center"
        >
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-semibold mb-4">Request Submitted!</h2>
          <p className="text-zinc-400 mb-4">
            Thank you for providing your requirements. Our team will review the details and get back to you shortly.
          </p>
          <p className="text-sm text-zinc-500 mb-8 border border-zinc-800 bg-zinc-900/50 rounded-lg p-3">
            A confirmation email has been sent to your address. Please check your spam or junk folders if you don't see it in your inbox.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-white text-black py-3 rounded-xl font-medium hover:bg-zinc-200 transition-colors"
          >
            Submit Another Request
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col selection:bg-zinc-800">
      <div className="flex-1 w-full max-w-3xl mx-auto p-4 md:p-8 flex flex-col">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-medium mb-3 tracking-wider uppercase">
            <span>Step {step} of {TOTAL_STEPS}</span>
            <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 max-w-2xl w-full mx-auto">
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1"
              >
                {step === 1 && <Step1Welcome />}
                {step === 2 && <Step2BusinessInfo formData={formData} handleChange={handleChange} />}
                {step === 3 && <Step3Requirements formData={formData} handleChange={handleChange} />}
                {step === 4 && <Step4Design formData={formData} handleChange={handleChange} />}
                {step === 5 && <Step5Branding formData={formData} handleChange={handleChange} handleLogoUpload={handleLogoUpload} />}
                {step === 6 && <Step6Content formData={formData} handleChange={handleChange} />}
                {step === 7 && <Step7Additional formData={formData} handleChange={handleChange} />}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="mt-12 flex items-center justify-between pt-6 border-t border-zinc-800">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 1 || isSubmitting}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  step === 1 ? "opacity-0 pointer-events-none" : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                )}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-xl text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full"
                    />
                    Saving...
                  </span>
                ) : step === TOTAL_STEPS ? (
                  <>
                    Submit Request <Send className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Continue <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Step Components (Extracted for readability)
// -------------------------------------------------------------

function Step1Welcome() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-semibold tracking-tight">Let's build your next digital experience.</h1>
      <p className="text-lg text-zinc-400 leading-relaxed">
        To ensure we deliver exactly what your business needs, please complete this requirements brief. 
        It takes about 5 minutes and will form the foundation of our project.
      </p>
      <div className="pt-8 grid gap-4 sm:grid-cols-2">
        <div className="p-5 border border-zinc-800 bg-zinc-900/50 rounded-2xl">
          <div className="text-2xl mb-3">🎯</div>
          <h3 className="font-medium mb-1">Clear Goals</h3>
          <p className="text-sm text-zinc-500">Define your project scope and objectives precisely.</p>
        </div>
        <div className="p-5 border border-zinc-800 bg-zinc-900/50 rounded-2xl">
          <div className="text-2xl mb-3">⚡</div>
          <h3 className="font-medium mb-1">Faster Kickoff</h3>
          <p className="text-sm text-zinc-500">Having details upfront accelerates our development execution.</p>
        </div>
      </div>
    </div>
  );
}

function Step2BusinessInfo({ formData, handleChange }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">Business Information</h2>
        <p className="text-zinc-400 text-sm">Tell us about you and your organization.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Business Name</label>
          <input required type="text" name="businessName" value={formData.businessName} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-zinc-600" placeholder="Acme Corp" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Owner / Contact Name</label>
          <input required type="text" name="ownerName" value={formData.ownerName} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-zinc-600" placeholder="John Doe" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Email Address</label>
          <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-zinc-600" placeholder="hello@acme.com" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Phone Number</label>
          <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-zinc-600" placeholder="+1 (555) 000-0000" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium text-zinc-300">WhatsApp Number (Optional)</label>
          <input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-zinc-600" placeholder="+1 (555) 000-0000" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium text-zinc-300">Business Address</label>
          <textarea rows={2} name="address" value={formData.address} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-zinc-600" placeholder="123 Innovation Drive, Suite 100..." />
        </div>
      </div>
    </div>
  );
}

function Step3Requirements({ formData, handleChange }: any) {
  const types = ['Business Website', 'Online Store', 'Portfolio', 'Other'];
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">Technical Requirements</h2>
        <p className="text-zinc-400 text-sm">Select the core capabilities your site needs.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-300">What type of website is this?</label>
          <div className="grid sm:grid-cols-2 gap-3">
            {types.map(type => (
              <label key={type} className="relative flex cursor-pointer">
                <input type="radio" name="websiteType" value={type} checked={formData.websiteType === type} onChange={handleChange} className="peer sr-only" />
                <div className="w-full p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors peer-checked:border-white peer-checked:bg-white/5">
                  <div className="text-sm font-medium text-white">{type}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-zinc-800/50">
          <label className="text-sm font-medium text-zinc-300">Core Integrations & Features</label>
          
          <label className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 cursor-pointer hover:bg-zinc-800/50 transition-colors">
            <input type="checkbox" name="onlineOrdering" checked={formData.onlineOrdering} onChange={handleChange} className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-white focus:ring-white focus:ring-offset-zinc-950" />
            <div className="flex-1">
              <div className="text-sm font-medium text-white">Online Ordering / E-commerce</div>
              <div className="text-xs text-zinc-500 mt-0.5">Allow customers to buy products directly</div>
            </div>
          </label>

          <label className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 cursor-pointer hover:bg-zinc-800/50 transition-colors">
            <input type="checkbox" name="whatsappIntegration" checked={formData.whatsappIntegration} onChange={handleChange} className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-white focus:ring-white focus:ring-offset-zinc-950" />
            <div className="flex-1">
              <div className="text-sm font-medium text-white">WhatsApp Integration</div>
              <div className="text-xs text-zinc-500 mt-0.5">Floating chat button linked to WhatsApp</div>
            </div>
          </label>

          <label className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 cursor-pointer hover:bg-zinc-800/50 transition-colors">
            <input type="checkbox" name="googleMaps" checked={formData.googleMaps} onChange={handleChange} className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-white focus:ring-white focus:ring-offset-zinc-950" />
            <div className="flex-1">
              <div className="text-sm font-medium text-white">Google Maps Embedding</div>
              <div className="text-xs text-zinc-500 mt-0.5">Show your location clearly to visitors</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

function Step4Design({ formData, handleChange }: any) {
  const styles = ['Modern', 'Luxury', 'Minimal', 'Fashion Store', 'Traditional'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">Design & Aesthetics</h2>
        <p className="text-zinc-400 text-sm">Help us understand your visual preferences.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-300">Preferred Design Style</label>
          <div className="flex flex-wrap gap-3">
            {styles.map(style => (
              <label key={style} className="relative flex cursor-pointer">
                <input type="radio" name="designStyle" value={style} checked={formData.designStyle === style} onChange={handleChange} className="peer sr-only" />
                <div className="px-5 py-3 rounded-full border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors peer-checked:border-white peer-checked:bg-white peer-checked:text-black">
                  <div className="text-sm font-medium tracking-tight">{style}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Preferred Colors</label>
          <input type="text" name="colors" value={formData.colors} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-zinc-600" placeholder="e.g. Navy Blue, Gold, and Off-white" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Example Websites You Like (Inspiration)</label>
          <textarea rows={3} name="exampleLinks" value={formData.exampleLinks} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-zinc-600" placeholder="https://apple.com - I like their typography..." />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Additional Design Notes</label>
          <textarea rows={2} name="designNotes" value={formData.designNotes} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-zinc-600" placeholder="Any specific visual elements to include or avoid?" />
        </div>
      </div>
    </div>
  );
}

function Step5Branding({ formData, handleChange, handleLogoUpload }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">Branding Elements</h2>
        <p className="text-zinc-400 text-sm">Upload your assets and define your voice.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">High-Resolution Logo</label>
          <div className="border-2 border-dashed border-zinc-800 rounded-xl p-8 text-center hover:bg-zinc-900/50 transition-colors relative">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleLogoUpload} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            />
            {formData.logo ? (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded overflow-hidden mb-3 bg-white/5 flex items-center justify-center">
                  <img src={formData.logo} alt="Preview" className="max-w-full max-h-full object-contain" />
                </div>
                <span className="text-sm text-emerald-400 font-medium">Logo attached (Click to change)</span>
              </div>
            ) : (
              <div className="flex flex-col items-center pointer-events-none">
                <Upload className="w-8 h-8 text-zinc-500 mb-3" />
                <span className="text-sm text-zinc-300 font-medium">Click to upload logo or drag and drop</span>
                <span className="text-xs text-zinc-500 mt-1">SVG, PNG, JPG or GIF (max. 10MB)</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Brand Description / Mission</label>
          <textarea rows={3} name="brandDescription" value={formData.brandDescription} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-zinc-600" placeholder="We provide premium landscaping services focus on sustainable..." />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Catchy Tagline</label>
          <input type="text" name="tagline" value={formData.tagline} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-zinc-600" placeholder="e.g. Elevating spaces, naturally." />
        </div>
      </div>
    </div>
  );
}

function Step6Content({ formData, handleChange }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">Content Foundation</h2>
        <p className="text-zinc-400 text-sm">Provide the core text and structuring for the site.</p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">About the Business</label>
          <textarea rows={3} name="aboutBusiness" value={formData.aboutBusiness} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-zinc-600" placeholder="Tell the story behind your company..." />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Services or Products Offered</label>
          <textarea rows={3} name="services" value={formData.services} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-zinc-600" placeholder="- Consulting
- Software Dev
- Design..." />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Working Hours</label>
            <textarea rows={2} name="workingHours" value={formData.workingHours} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-zinc-600" placeholder="Mon-Fri: 9AM - 5PM" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Social Media Links</label>
            <textarea rows={2} name="socialMedia" value={formData.socialMedia} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-zinc-600" placeholder="IG: @acme
Twitter: @acme" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Step7Additional({ formData, handleChange }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">Final Details</h2>
        <p className="text-zinc-400 text-sm">Any extra features or specific requests.</p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Special Features Needed</label>
          <textarea rows={4} name="specialFeatures" value={formData.specialFeatures} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-zinc-600" placeholder="e.g. Appointment booking system, member login portal, event calendar..." />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Additional Notes / Questions</label>
          <textarea rows={3} name="extraNotes" value={formData.extraNotes} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-zinc-600" placeholder="Use this space for anything that wasn't covered above..." />
        </div>
      </div>
    </div>
  );
}

