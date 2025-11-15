import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Brain, Zap, Shield, Search, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'

const AIChatWithPDF = () => {
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
          "name": "What is AI Chat with PDF?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "AI Chat with PDF is an intelligent feature that allows you to have natural conversations with your PDF documents. Upload any PDF and ask questions in plain language - our AI will analyze the content and provide accurate, contextual answers instantly. It's like having a smart assistant that has read and understood your entire document."
          }
        },
        {
          "@type": "Question",
          "name": "How does AI Chat with PDF work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "When you upload a PDF, our AI processes and indexes the entire document. You can then ask questions in natural language, and the AI searches through the content, understands context, and provides relevant answers with citations. It uses advanced natural language processing to understand your questions and extract precise information from the document."
          }
        },
        {
          "@type": "Question",
          "name": "Is my PDF data secure when using AI Chat?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Absolutely. All PDFs are encrypted during upload and processing. We use enterprise-grade security with SSL/TLS encryption. Your documents are processed securely and automatically deleted after your session. We never use your documents to train AI models or share them with third parties."
          }
        },
        {
          "@type": "Question",
          "name": "What types of questions can I ask?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "You can ask any question about the content in your PDF - from simple fact-finding queries to complex analytical questions. Examples include: 'What are the main conclusions?', 'Summarize section 3', 'Find all mentions of [topic]', 'Compare X and Y', or 'What does the author say about [subject]?'"
          }
        },
        {
          "@type": "Question",
          "name": "Can I chat with multiple PDFs at once?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! Pro and Business plan users can upload multiple PDFs and ask questions across all documents simultaneously. This is perfect for research, comparing documents, or finding information across multiple sources."
          }
        },
        {
          "@type": "Question",
          "name": "What file size limits apply to AI Chat with PDF?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Free users can chat with PDFs up to 10MB. Pro users have a 50MB limit per file, and Business users can process files up to 100MB. The AI can handle documents with hundreds of pages efficiently."
          }
        },
        {
          "@type": "Question",
          "name": "Does AI Chat work with scanned PDFs?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! If your PDF is a scanned image, our AI will automatically perform OCR (Optical Character Recognition) to extract the text first, then enable chat functionality. This works seamlessly for both native and scanned PDFs."
          }
        },
        {
          "@type": "Question",
          "name": "How accurate are the AI responses?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Our AI Chat provides highly accurate responses based on the content in your PDF. It includes citations showing exactly where information was found. The AI is designed to say 'I don't know' rather than make up information if the answer isn't in the document."
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
            AI Chat with PDF — Ask Questions, Get Instant Answers
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Transform how you interact with PDF documents. Upload any PDF and have natural conversations 
            with your content. Our AI understands context, finds relevant information instantly, and 
            provides accurate answers with citations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
                Start Chatting Free <ArrowRight className="ml-2 h-5 w-5" />
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
            How AI Chat with PDF Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload Your PDF</h3>
              <p className="text-muted-foreground">
                Upload any PDF document - research papers, contracts, reports, books, or manuals.
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Ask Questions</h3>
              <p className="text-muted-foreground">
                Type your questions in natural language. The AI understands context and intent.
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Instant Answers</h3>
              <p className="text-muted-foreground">
                Receive accurate answers with citations showing exactly where the information was found.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Powerful AI Chat Features
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <Brain className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Contextual Understanding</h3>
                <p className="text-muted-foreground">
                  Our AI understands context, relationships, and nuances in your documents for intelligent responses.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Search className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Smart Search & Citations</h3>
                <p className="text-muted-foreground">
                  Every answer includes citations with page numbers and exact locations in your document.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <MessageSquare className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Natural Conversations</h3>
                <p className="text-muted-foreground">
                  Ask follow-up questions and have multi-turn conversations just like chatting with a human expert.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Zap className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
                <p className="text-muted-foreground">
                  Get answers in seconds, even from lengthy documents with hundreds of pages.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Enterprise Security</h3>
                <p className="text-muted-foreground">
                  Bank-level encryption, automatic file deletion, and complete privacy protection.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <MessageSquare className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Multi-Document Chat</h3>
                <p className="text-muted-foreground">
                  Chat with multiple PDFs simultaneously to compare information and find connections.
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
            Perfect For Every Use Case
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">📚 Students & Researchers</h3>
              <p className="text-muted-foreground">
                Quickly find information in research papers, textbooks, and academic documents. Perfect for 
                literature reviews and study sessions.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">💼 Business Professionals</h3>
              <p className="text-muted-foreground">
                Extract insights from reports, contracts, and proposals. Save hours of manual document review.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">⚖️ Legal Teams</h3>
              <p className="text-muted-foreground">
                Navigate complex legal documents, find specific clauses, and compare contract terms efficiently.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">🏥 Healthcare</h3>
              <p className="text-muted-foreground">
                Quickly reference medical documents, research papers, and patient records with AI assistance.
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
              <h3 className="text-xl font-semibold mb-3">What is AI Chat with PDF?</h3>
              <p className="text-muted-foreground">
                AI Chat with PDF is an intelligent feature that allows you to have natural conversations with 
                your PDF documents. Upload any PDF and ask questions in plain language - our AI will analyze 
                the content and provide accurate, contextual answers instantly. It's like having a smart 
                assistant that has read and understood your entire document.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">How does AI Chat with PDF work?</h3>
              <p className="text-muted-foreground">
                When you upload a PDF, our AI processes and indexes the entire document. You can then ask 
                questions in natural language, and the AI searches through the content, understands context, 
                and provides relevant answers with citations. It uses advanced natural language processing to 
                understand your questions and extract precise information from the document.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Is my PDF data secure when using AI Chat?</h3>
              <p className="text-muted-foreground">
                Absolutely. All PDFs are encrypted during upload and processing. We use enterprise-grade 
                security with SSL/TLS encryption. Your documents are processed securely and automatically 
                deleted after your session. We never use your documents to train AI models or share them 
                with third parties.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">What types of questions can I ask?</h3>
              <p className="text-muted-foreground">
                You can ask any question about the content in your PDF - from simple fact-finding queries to 
                complex analytical questions. Examples include: 'What are the main conclusions?', 'Summarize 
                section 3', 'Find all mentions of [topic]', 'Compare X and Y', or 'What does the author say 
                about [subject]?'
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Can I chat with multiple PDFs at once?</h3>
              <p className="text-muted-foreground">
                Yes! Pro and Business plan users can upload multiple PDFs and ask questions across all 
                documents simultaneously. This is perfect for research, comparing documents, or finding 
                information across multiple sources.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">What file size limits apply to AI Chat with PDF?</h3>
              <p className="text-muted-foreground">
                Free users can chat with PDFs up to 10MB. Pro users have a 50MB limit per file, and Business 
                users can process files up to 100MB. The AI can handle documents with hundreds of pages 
                efficiently.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Does AI Chat work with scanned PDFs?</h3>
              <p className="text-muted-foreground">
                Yes! If your PDF is a scanned image, our AI will automatically perform OCR (Optical Character 
                Recognition) to extract the text first, then enable chat functionality. This works seamlessly 
                for both native and scanned PDFs.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">How accurate are the AI responses?</h3>
              <p className="text-muted-foreground">
                Our AI Chat provides highly accurate responses based on the content in your PDF. It includes 
                citations showing exactly where information was found. The AI is designed to say 'I don't know' 
                rather than make up information if the answer isn't in the document.
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
            <Link to="/ai-smart-summary">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <h3 className="text-xl font-semibold mb-2">Smart Summary</h3>
                <p className="text-muted-foreground">
                  Generate intelligent summaries of long PDF documents in seconds.
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
            Ready to Chat with Your PDFs?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of users who are transforming how they work with PDF documents.
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

export default AIChatWithPDF
