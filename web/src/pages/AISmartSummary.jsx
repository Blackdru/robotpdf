import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Sparkles, Clock, Target, CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'

const AISmartSummary = () => {
  useEffect(() => {
    // Add FAQ structured data
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is AI Smart Summary for PDF?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "AI Smart Summary is an intelligent tool that automatically generates concise, accurate summaries of PDF documents using advanced artificial intelligence. It analyzes the entire document, identifies key points, main arguments, and important details, then creates a coherent summary that captures the essence of the content in a fraction of the time it would take to read manually."
          }
        },
        {
          "@type": "Question",
          "name": "How long does it take to generate a PDF summary?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Most PDF summaries are generated in 10-30 seconds, depending on document length and complexity. Even lengthy documents with 100+ pages can be summarized in under a minute. Our AI processes documents efficiently while maintaining high accuracy."
          }
        },
        {
          "@type": "Question",
          "name": "Can I customize the length of the summary?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! You can choose from different summary lengths: brief (a few sentences), standard (1-2 paragraphs), or detailed (comprehensive overview). You can also specify custom length requirements or focus areas for the summary."
          }
        },
        {
          "@type": "Question",
          "name": "What types of documents work best with AI Smart Summary?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "AI Smart Summary works excellently with research papers, reports, articles, books, legal documents, contracts, meeting notes, and any text-heavy PDF. It's particularly useful for academic papers, business reports, and technical documentation."
          }
        },
        {
          "@type": "Question",
          "name": "Is the AI summary accurate?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, our AI Smart Summary uses state-of-the-art natural language processing to ensure high accuracy. It identifies key concepts, main arguments, and critical details without adding information that isn't in the original document. The AI is trained on millions of documents to understand context and importance."
          }
        },
        {
          "@type": "Question",
          "name": "Can I summarize multiple PDFs at once?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! Pro and Business users can batch process multiple PDFs and generate summaries for all of them simultaneously. This is perfect for reviewing multiple research papers, reports, or documents quickly."
          }
        },
        {
          "@type": "Question",
          "name": "Does AI Smart Summary work with scanned PDFs?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Absolutely! If your PDF is a scanned image, our system automatically performs OCR (Optical Character Recognition) to extract the text first, then generates the summary. This works seamlessly for both native and scanned PDFs."
          }
        },
        {
          "@type": "Question",
          "name": "Can I export or share the summary?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, you can export summaries as text files, PDF documents, or copy them to your clipboard. You can also save summaries to your account for future reference and share them with team members."
          }
        }
      ]
    })
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden">
      {/* Subtle Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-indigo-100/30 to-purple-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/30 to-cyan-100/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] bg-gradient-to-br from-purple-100/20 to-pink-100/20 rounded-full blur-3xl"></div>
      </div>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            AI Smart Summary — Summarize PDFs in Seconds
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Save hours of reading time with intelligent AI-powered summaries. Upload any PDF and get 
            accurate, concise summaries that capture key points, main arguments, and critical details. 
            Perfect for research, business reports, and lengthy documents.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
                Summarize Free Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 w-full sm:w-auto">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How AI Smart Summary Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload Your PDF</h3>
              <p className="text-muted-foreground">
                Upload any PDF document - research papers, reports, books, articles, or contracts.
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
              <p className="text-muted-foreground">
                Our AI reads and analyzes the entire document, identifying key concepts and main points.
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Your Summary</h3>
              <p className="text-muted-foreground">
                Receive a concise, accurate summary in seconds. Export, share, or save for later.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Powerful Smart Summary Features
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Intelligent Extraction</h3>
                <p className="text-muted-foreground">
                  AI identifies the most important information, key arguments, and critical details automatically.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Clock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Save 90% Reading Time</h3>
                <p className="text-muted-foreground">
                  Get the essence of lengthy documents in seconds instead of spending hours reading.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Target className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Customizable Length</h3>
                <p className="text-muted-foreground">
                  Choose brief, standard, or detailed summaries based on your needs and preferences.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">High Accuracy</h3>
                <p className="text-muted-foreground">
                  State-of-the-art AI ensures summaries are accurate, coherent, and faithful to the original.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <FileText className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Multiple Formats</h3>
                <p className="text-muted-foreground">
                  Export summaries as text, PDF, or copy to clipboard. Save to your account for reference.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Batch Processing</h3>
                <p className="text-muted-foreground">
                  Summarize multiple PDFs at once to quickly review large volumes of documents.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Perfect For Every Professional
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">📚 Students & Academics</h3>
              <p className="text-muted-foreground">
                Quickly review research papers, textbooks, and academic articles. Perfect for literature 
                reviews, exam preparation, and research projects.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">💼 Business Executives</h3>
              <p className="text-muted-foreground">
                Stay informed with summaries of reports, market analyses, and business documents. Make 
                faster, better-informed decisions.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">⚖️ Legal Professionals</h3>
              <p className="text-muted-foreground">
                Quickly review contracts, case files, and legal documents. Identify key clauses and 
                important terms efficiently.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">📰 Journalists & Writers</h3>
              <p className="text-muted-foreground">
                Research faster by summarizing source materials, reports, and reference documents for 
                your articles and stories.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">🔬 Researchers</h3>
              <p className="text-muted-foreground">
                Screen papers quickly, identify relevant studies, and stay current with the latest 
                research in your field.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">👨‍💼 Consultants</h3>
              <p className="text-muted-foreground">
                Digest client documents, industry reports, and background materials efficiently to 
                deliver better insights.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">What is AI Smart Summary for PDF?</h3>
              <p className="text-muted-foreground">
                AI Smart Summary is an intelligent tool that automatically generates concise, accurate 
                summaries of PDF documents using advanced artificial intelligence. It analyzes the entire 
                document, identifies key points, main arguments, and important details, then creates a 
                coherent summary that captures the essence of the content in a fraction of the time it 
                would take to read manually.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">How long does it take to generate a PDF summary?</h3>
              <p className="text-muted-foreground">
                Most PDF summaries are generated in 10-30 seconds, depending on document length and 
                complexity. Even lengthy documents with 100+ pages can be summarized in under a minute. 
                Our AI processes documents efficiently while maintaining high accuracy.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Can I customize the length of the summary?</h3>
              <p className="text-muted-foreground">
                Yes! You can choose from different summary lengths: brief (a few sentences), standard 
                (1-2 paragraphs), or detailed (comprehensive overview). You can also specify custom length 
                requirements or focus areas for the summary.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">What types of documents work best with AI Smart Summary?</h3>
              <p className="text-muted-foreground">
                AI Smart Summary works excellently with research papers, reports, articles, books, legal 
                documents, contracts, meeting notes, and any text-heavy PDF. It's particularly useful for 
                academic papers, business reports, and technical documentation.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Is the AI summary accurate?</h3>
              <p className="text-muted-foreground">
                Yes, our AI Smart Summary uses state-of-the-art natural language processing to ensure high 
                accuracy. It identifies key concepts, main arguments, and critical details without adding 
                information that isn't in the original document. The AI is trained on millions of documents 
                to understand context and importance.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Can I summarize multiple PDFs at once?</h3>
              <p className="text-muted-foreground">
                Yes! Pro and Business users can batch process multiple PDFs and generate summaries for all 
                of them simultaneously. This is perfect for reviewing multiple research papers, reports, or 
                documents quickly.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Does AI Smart Summary work with scanned PDFs?</h3>
              <p className="text-muted-foreground">
                Absolutely! If your PDF is a scanned image, our system automatically performs OCR (Optical 
                Character Recognition) to extract the text first, then generates the summary. This works 
                seamlessly for both native and scanned PDFs.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Can I export or share the summary?</h3>
              <p className="text-muted-foreground">
                Yes, you can export summaries as text files, PDF documents, or copy them to your clipboard. 
                You can also save summaries to your account for future reference and share them with team 
                members.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Related Tools */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Related AI PDF Tools
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link to="/ai-enhanced-ocr-pdf">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <h3 className="text-xl font-semibold mb-2">AI-Enhanced OCR</h3>
                <p className="text-muted-foreground">
                  Extract text from scanned PDFs with 99% accuracy using advanced AI.
                </p>
              </Card>
            </Link>
            <Link to="/ai-chat-with-pdf">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <h3 className="text-xl font-semibold mb-2">Chat with PDF</h3>
                <p className="text-muted-foreground">
                  Ask questions and get instant answers from your PDF documents using AI.
                </p>
              </Card>
            </Link>
            <Link to="/pricing">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <h3 className="text-xl font-semibold mb-2">View All Plans</h3>
                <p className="text-muted-foreground">
                  Explore our pricing options and find the perfect plan for your needs.
                </p>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Save Hours of Reading Time?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of professionals who use AI Smart Summary to work smarter, not harder.
          </p>
          <Link to="/register">
            <Button size="lg" className="text-lg px-8 py-6">
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

export default AISmartSummary
