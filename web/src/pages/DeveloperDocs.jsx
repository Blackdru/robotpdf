import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Book, Code, Server, Key, Zap, Shield, Search, ArrowLeft, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const DeveloperDocs = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: Zap },
    { id: 'authentication', title: 'Authentication', icon: Key },
    { id: 'endpoints', title: 'API Endpoints', icon: Server },
    { id: 'examples', title: 'Code Examples', icon: Code },
    { id: 'security', title: 'Security', icon: Shield }
  ];

  const endpoints = [
    { method: 'GET', path: '/v1/health', description: 'Check API health and authentication', auth: true },
    { method: 'GET', path: '/v1/usage', description: 'Get usage statistics', auth: true },
    { method: 'POST', path: '/v1/ocr', description: 'Extract text from images/PDFs', auth: true },
    { method: 'POST', path: '/v1/chat', description: 'Chat with your documents using AI', auth: true },
    { method: 'POST', path: '/v1/summarize', description: 'AI-powered document summarization', auth: true },
    { method: 'POST', path: '/v1/compress', description: 'Compress PDF files', auth: true },
    { method: 'POST', path: '/v1/images-to-pdf', description: 'Convert images to PDF', auth: true },
    { method: 'POST', path: '/v1/convert/pdf-to-docx', description: 'Convert PDF to Word', auth: true },
    { method: 'POST', path: '/v1/merge', description: 'Merge multiple PDFs', auth: true },
    { method: 'POST', path: '/v1/split', description: 'Split PDF pages', auth: true },
    { method: 'POST', path: '/v1/resumes/generate', description: 'Generate professional resume with AI', auth: true },
    { method: 'POST', path: '/v1/resumes/export', description: 'Export resume to PDF or DOCX', auth: true },
    { method: 'GET', path: '/v1/resumes/templates', description: 'Get available resume templates', auth: true },
    { method: 'GET', path: '/v1/resumes/industries', description: 'Get list of industries', auth: true },
    { method: 'GET', path: '/v1/resumes/experience-levels', description: 'Get experience level options', auth: true }
  ];

  const platforms = [
    { id: 'nodejs', name: 'Node.js', icon: '🟢' },
    { id: 'python', name: 'Python', icon: '🐍' },
    { id: 'php', name: 'PHP', icon: '🐘' },
    { id: 'java', name: 'Java', icon: '☕' },
    { id: 'csharp', name: 'C#', icon: '💜' },
    { id: 'ruby', name: 'Ruby', icon: '💎' },
    { id: 'go', name: 'Go', icon: '🔵' },
    { id: 'curl', name: 'cURL', icon: '🔧' }
  ];

  const [selectedPlatform, setSelectedPlatform] = useState('nodejs');

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden">
      {/* Subtle Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-indigo-100/30 to-purple-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/30 to-cyan-100/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] bg-gradient-to-br from-purple-100/20 to-pink-100/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <Link to="/developers" className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-slate-700 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Portal
          </Link>
          <Link to="/developers/keys" className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-slate-700 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
            <Key className="w-4 h-4" />
            API Keys
          </Link>
          <Link to="/developers/usage" className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-slate-700 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
            <BarChart3 className="w-4 h-4" />
            Usage
          </Link>
          <Link to="/developers/playground" className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-slate-700 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
            <Code className="w-4 h-4" />
            Playground
          </Link>
        </div>
        
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            API Documentation
          </h1>
          <p className="text-slate-600 mb-6">
            Complete reference for RobotPDF API v1
          </p>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 shadow-md sticky top-4">
              <h3 className="font-semibold text-slate-900 mb-4">Contents</h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-2 rounded-xl transition-colors flex items-center gap-3 ${
                      activeSection === section.id
                        ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <section.icon className="w-4 h-4" />
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Getting Started */}
            {activeSection === 'getting-started' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-md"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Getting Started</h2>
                <div className="prose max-w-none">
                  <p className="text-slate-600 mb-4">
                    Welcome to the RobotPDF API! This guide will help you get started with integrating our powerful PDF tools into your applications.
                  </p>
                  
                  <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">Base URL</h3>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl font-mono text-sm text-slate-900 mb-4">
                    https://api.robotpdf.com/api/v1
                  </div>

                  <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">Quick Example</h3>
                  <pre className="bg-slate-900 p-4 rounded-xl overflow-x-auto">
                    <code className="text-sm text-green-400">{`curl -X GET https://api.robotpdf.com/api/v1/health \\
  -H "x-api-key: pk_live_YOUR_KEY" \\
  -H "x-api-secret: sk_live_YOUR_SECRET"`}</code>
                  </pre>
                </div>
              </motion.div>
            )}

            {/* Authentication */}
            {activeSection === 'authentication' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-md"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Authentication</h2>
                <div className="prose max-w-none">
                  <p className="text-slate-600 mb-4">
                    All API requests require authentication using API keys. Include both headers in every request:
                  </p>
                  
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl font-mono text-sm text-slate-900 mb-4">
                    x-api-key: pk_live_XXXXX<br/>
                    x-api-secret: sk_live_XXXXX
                  </div>

                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-4">
                    <p className="text-sm text-amber-900">
                      <strong>Security:</strong> Never expose your API secret in client-side code or public repositories. Store it securely on your server.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Endpoints */}
            {activeSection === 'endpoints' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6">API Endpoints</h2>
                {endpoints.map((endpoint, index) => (
                  <div key={index} className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-md hover:shadow-lg hover:border-indigo-200 transition-all">
                    <div className="flex items-start gap-4">
                      <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                        endpoint.method === 'GET' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {endpoint.method}
                      </span>
                      <div className="flex-1">
                        <div className="font-mono text-slate-900 mb-2">
                          {endpoint.path}
                        </div>
                        <p className="text-sm text-slate-600">
                          {endpoint.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Examples */}
            {activeSection === 'examples' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-md">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Implementation Examples</h2>
                  
                  {/* Platform Selector */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {platforms.map(platform => (
                      <button
                        key={platform.id}
                        onClick={() => setSelectedPlatform(platform.id)}
                        className={`px-4 py-2 rounded-xl transition-all font-medium ${
                          selectedPlatform === platform.id
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {platform.icon} {platform.name}
                      </button>
                    ))}
                  </div>

                  {/* Node.js Examples */}
                  {selectedPlatform === 'nodejs' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Installation</h3>
                        <pre className="bg-slate-900 p-4 rounded-xl overflow-x-auto">
                          <code className="text-sm text-green-400">npm install axios form-data</code>
                        </pre>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Text Summarization</h3>
                        <pre className="bg-slate-900 p-4 rounded-xl overflow-x-auto">
                          <code className="text-sm text-slate-300">{`const axios = require('axios');

const API_KEY = 'pk_live_YOUR_KEY';
const API_SECRET = 'sk_live_YOUR_SECRET';
const BASE_URL = 'https://api.robotpdf.com/api/v1';

async function summarizeText(text) {
  const response = await axios.post(
    \`\${BASE_URL}/summarize\`,
    { text, summary_type: 'brief' },
    {
      headers: {
        'x-api-key': API_KEY,
        'x-api-secret': API_SECRET,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data.data.summary;
}

summarizeText('Your long text here...').then(console.log);`}</code>
                        </pre>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">File Upload (OCR)</h3>
                        <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto">
                          <code className="text-sm text-slate-300">{`const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function extractText(filePath) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  formData.append('language', 'eng');
  
  const response = await axios.post(
    \`\${BASE_URL}/ocr\`,
    formData,
    {
      headers: {
        'x-api-key': API_KEY,
        'x-api-secret': API_SECRET,
        ...formData.getHeaders()
      }
    }
  );
  return response.data.data.text;
}

extractText('document.png').then(console.log);`}</code>
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Python Examples */}
                  {selectedPlatform === 'python' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Installation</h3>
                        <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto">
                          <code className="text-sm text-green-400">pip install requests</code>
                        </pre>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Text Summarization</h3>
                        <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto">
                          <code className="text-sm text-slate-300">{`import requests

API_KEY = 'pk_live_YOUR_KEY'
API_SECRET = 'sk_live_YOUR_SECRET'
BASE_URL = 'https://api.robotpdf.com/api/v1'

def summarize_text(text):
    response = requests.post(
        f'{BASE_URL}/summarize',
        headers={
            'x-api-key': API_KEY,
            'x-api-secret': API_SECRET,
            'Content-Type': 'application/json'
        },
        json={'text': text, 'summary_type': 'brief'}
    )
    return response.json()['data']['summary']

print(summarize_text('Your long text here...'))`}</code>
                        </pre>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">File Upload (OCR)</h3>
                        <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto">
                          <code className="text-sm text-slate-300">{`import requests

def extract_text(file_path):
    with open(file_path, 'rb') as f:
        files = {'file': f}
        data = {'language': 'eng'}
        response = requests.post(
            f'{BASE_URL}/ocr',
            headers={
                'x-api-key': API_KEY,
                'x-api-secret': API_SECRET
            },
            files=files,
            data=data
        )
    return response.json()['data']['text']

print(extract_text('document.png'))`}</code>
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* PHP Examples */}
                  {selectedPlatform === 'php' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Text Summarization</h3>
                        <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto">
                          <code className="text-sm text-slate-300">{`<?php
$apiKey = 'pk_live_YOUR_KEY';
$apiSecret = 'sk_live_YOUR_SECRET';
$baseUrl = 'https://api.robotpdf.com/api/v1';

function summarizeText($text) {
    global $apiKey, $apiSecret, $baseUrl;
    
    $ch = curl_init("$baseUrl/summarize");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'x-api-key: ' . $apiKey,
        'x-api-secret: ' . $apiSecret,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'text' => $text,
        'summary_type' => 'brief'
    ]));
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true)['data']['summary'];
}

echo summarizeText('Your long text here...');
?>`}</code>
                        </pre>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">File Upload (OCR)</h3>
                        <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto">
                          <code className="text-sm text-slate-300">{`<?php
function extractText($filePath) {
    global $apiKey, $apiSecret, $baseUrl;
    
    $ch = curl_init("$baseUrl/ocr");
    $cfile = new CURLFile($filePath);
    
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'x-api-key: ' . $apiKey,
        'x-api-secret: ' . $apiSecret
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, [
        'file' => $cfile,
        'language' => 'eng'
    ]);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true)['data']['text'];
}

echo extractText('document.png');
?>`}</code>
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Java Examples */}
                  {selectedPlatform === 'java' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Dependencies (Maven)</h3>
                        <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto">
                          <code className="text-sm text-slate-300">{`<dependency>
    <groupId>com.squareup.okhttp3</groupId>
    <artifactId>okhttp</artifactId>
    <version>4.12.0</version>
</dependency>
<dependency>
    <groupId>com.google.code.gson</groupId>
    <artifactId>gson</artifactId>
    <version>2.10.1</version>
</dependency>`}</code>
                        </pre>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Text Summarization</h3>
                        <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto">
                          <code className="text-sm text-slate-300">{`import okhttp3.*;
import com.google.gson.Gson;

public class RobotPDFClient {
    private static final String API_KEY = "pk_live_YOUR_KEY";
    private static final String API_SECRET = "sk_live_YOUR_SECRET";
    private static final String BASE_URL = "https://api.robotpdf.com/api/v1";
    
    public static String summarizeText(String text) throws Exception {
        OkHttpClient client = new OkHttpClient();
        Gson gson = new Gson();
        
        String json = gson.toJson(Map.of(
            "text", text,
            "summary_type", "brief"
        ));
        
        RequestBody body = RequestBody.create(
            json, MediaType.parse("application/json")
        );
        
        Request request = new Request.Builder()
            .url(BASE_URL + "/summarize")
            .addHeader("x-api-key", API_KEY)
            .addHeader("x-api-secret", API_SECRET)
            .post(body)
            .build();
        
        Response response = client.newCall(request).execute();
        return response.body().string();
    }
}`}</code>
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* C# Examples */}
                  {selectedPlatform === 'csharp' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Installation</h3>
                        <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto">
                          <code className="text-sm text-green-400">dotnet add package Newtonsoft.Json</code>
                        </pre>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Text Summarization</h3>
                        <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto">
                          <code className="text-sm text-slate-300">{`using System;
using System.Net.Http;
using System.Text;
using Newtonsoft.Json;

class RobotPDFClient
{
    private const string API_KEY = "pk_live_YOUR_KEY";
    private const string API_SECRET = "sk_live_YOUR_SECRET";
    private const string BASE_URL = "https://api.robotpdf.com/api/v1";
    
    public static async Task<string> SummarizeText(string text)
    {
        using var client = new HttpClient();
        client.DefaultRequestHeaders.Add("x-api-key", API_KEY);
        client.DefaultRequestHeaders.Add("x-api-secret", API_SECRET);
        
        var payload = new { text, summary_type = "brief" };
        var content = new StringContent(
            JsonConvert.SerializeObject(payload),
            Encoding.UTF8,
            "application/json"
        );
        
        var response = await client.PostAsync(
            $"{BASE_URL}/summarize", content
        );
        return await response.Content.ReadAsStringAsync();
    }
}`}</code>
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Ruby Examples */}
                  {selectedPlatform === 'ruby' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Installation</h3>
                        <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto">
                          <code className="text-sm text-green-400">gem install httparty</code>
                        </pre>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Text Summarization</h3>
                        <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto">
                          <code className="text-sm text-slate-300">{`require 'httparty'

API_KEY = 'pk_live_YOUR_KEY'
API_SECRET = 'sk_live_YOUR_SECRET'
BASE_URL = 'https://api.robotpdf.com/api/v1'

def summarize_text(text)
  response = HTTParty.post(
    "#{BASE_URL}/summarize",
    headers: {
      'x-api-key' => API_KEY,
      'x-api-secret' => API_SECRET,
      'Content-Type' => 'application/json'
    },
    body: { text: text, summary_type: 'brief' }.to_json
  )
  response['data']['summary']
end

puts summarize_text('Your long text here...')`}</code>
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Go Examples */}
                  {selectedPlatform === 'go' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Text Summarization</h3>
                        <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto">
                          <code className="text-sm text-slate-300">{`package main

import (
    "bytes"
    "encoding/json"
    "net/http"
)

const (
    API_KEY    = "pk_live_YOUR_KEY"
    API_SECRET = "sk_live_YOUR_SECRET"
    BASE_URL   = "https://api.robotpdf.com/api/v1"
)

func SummarizeText(text string) (string, error) {
    payload := map[string]string{
        "text":         text,
        "summary_type": "brief",
    }
    jsonData, _ := json.Marshal(payload)
    
    req, _ := http.NewRequest(
        "POST",
        BASE_URL+"/summarize",
        bytes.NewBuffer(jsonData)
    )
    req.Header.Set("x-api-key", API_KEY)
    req.Header.Set("x-api-secret", API_SECRET)
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()
    
    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)
    return result["data"].(map[string]interface{})["summary"].(string), nil
}`}</code>
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* cURL Examples */}
                  {selectedPlatform === 'curl' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Text Summarization</h3>
                        <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto">
                          <code className="text-sm text-slate-300">{`curl -X POST https://api.robotpdf.com/api/v1/summarize \\
  -H "x-api-key: pk_live_YOUR_KEY" \\
  -H "x-api-secret: sk_live_YOUR_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Your long text here...",
    "summary_type": "brief"
  }'`}</code>
                        </pre>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">File Upload (OCR)</h3>
                        <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto">
                          <code className="text-sm text-slate-300">{`curl -X POST https://api.robotpdf.com/api/v1/ocr \\
  -H "x-api-key: pk_live_YOUR_KEY" \\
  -H "x-api-secret: sk_live_YOUR_SECRET" \\
  -F "file=@document.png" \\
  -F "language=eng"`}</code>
                        </pre>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">PDF Compression</h3>
                        <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto">
                          <code className="text-sm text-slate-300">{`curl -X POST https://api.robotpdf.com/api/v1/compress \\
  -H "x-api-key: pk_live_YOUR_KEY" \\
  -H "x-api-secret: sk_live_YOUR_SECRET" \\
  -F "file=@document.pdf" \\
  -F "quality=medium"`}</code>
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Security */}
            {activeSection === 'security' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-md"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Security Best Practices</h2>
                <ul className="space-y-3 text-slate-600">
                  <li className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span>Never expose API secrets in client-side code or public repositories</span>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span>Store API credentials in environment variables on your server</span>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span>Use test keys for development and live keys for production</span>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span>Rotate API keys regularly and immediately if compromised</span>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span>Always use HTTPS for API requests in production</span>
                  </li>
                </ul>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperDocs;
