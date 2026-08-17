import { useState } from 'react'
import { Sparkles, X, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StoreSettings } from '@/lib/types'
import { cn } from '@/lib/utils'
import { GoogleGenAI, Type, Schema } from '@google/genai'
import { useI18n } from '@/lib/i18n'

interface AiDesignAssistantProps {
  currentForm: Partial<StoreSettings>
  onUpdateForm: (newForm: Partial<StoreSettings>) => void
}

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY })

const storeSettingsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    primary_color: { type: Type.STRING, description: "Hex color code for primary color (e.g. #000000)" },
    secondary_color: { type: Type.STRING, description: "Hex color code for secondary color/background (e.g. #f3f4f6)" },
    font: { type: Type.STRING, description: "One of: Inter, Poppins, Playfair Display, Roboto, Lora, Montserrat, Tajawal, Cairo" },
    homepage_sections: {
      type: Type.OBJECT,
      properties: {
        show_featured: { type: Type.BOOLEAN },
        show_categories: { type: Type.BOOLEAN },
        show_banner: { type: Type.BOOLEAN },
        banner_heading: { type: Type.STRING, description: "A catchy headline for the store banner" },
        banner_subheading: { type: Type.STRING, description: "A short engaging subtitle for the store banner" }
      }
    },
    design_config: {
      type: Type.OBJECT,
      properties: {
        button_style: { type: Type.STRING, description: "One of: pill, rounded, square" },
        card_style: { type: Type.STRING, description: "One of: shadow, border, flat" },
        category_shape: { type: Type.STRING, description: "One of: circle, rounded, square" },
        product_image_ratio: { type: Type.STRING, description: "One of: square, portrait, landscape" },
        section_order: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "An array defining the order of homepage sections. Allowed strings: banner, categories, featured"
        }
      }
    }
  }
}

export function AiDesignAssistant({ currentForm, onUpdateForm }: AiDesignAssistantProps) {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isLoading) return

    setIsLoading(true)
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: `You are an expert web designer configuring an e-commerce storefront. The user wants this: "${prompt}". Based on this request, generate the optimal design configuration. Do not hallucinate fields outside the schema. Ensure valid hex codes.` }] }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: storeSettingsSchema,
        }
      })
      
      const text = response.text
      if (text) {
        const result = JSON.parse(text)
        
        // Merge with current form
        const updatedForm = { ...currentForm }
        
        if (result.primary_color) updatedForm.primary_color = result.primary_color
        if (result.secondary_color) updatedForm.secondary_color = result.secondary_color
        if (result.font) updatedForm.font = result.font
        
        if (result.homepage_sections) {
          updatedForm.homepage_sections = {
            ...(updatedForm.homepage_sections ?? { show_banner: true, show_categories: true, show_featured: true, banner_heading: '', banner_subheading: '' }),
            ...result.homepage_sections
          }
        }
        
        if (result.design_config) {
          updatedForm.design_config = {
            ...(updatedForm.design_config ?? {}),
            ...result.design_config
          }
        }
        
        onUpdateForm(updatedForm)
        setPrompt('')
      }
    } catch (error) {
      console.error("AI Generation Error:", error)
      alert(t('aiAssistant.error') ?? "Failed to generate design. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl",
          isOpen && "hidden"
        )}
      >
        <Sparkles className="h-5 w-5" />
        {t('aiAssistant.button') ?? 'AI Assistant'}
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <h3 className="font-bold">{t('aiAssistant.title') ?? 'AI Design Assistant'}</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-full p-1 hover:bg-white/20 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="p-4 bg-gray-50/50">
            <p className="text-sm text-gray-600 mb-4">
              {t('aiAssistant.description') ?? 'Describe how you want your store to look, and I\'ll configure it instantly!'}
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t('aiAssistant.placeholder') ?? "e.g. Make it a luxury watch store with a dark theme and sharp edges..."}
                className="w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                rows={4}
                disabled={isLoading}
              />
              <Button type="submit" disabled={!prompt.trim() || isLoading} className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isLoading ? (t('aiAssistant.designing') ?? "Designing...") : (t('aiAssistant.designIt') ?? "Design It!")}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
