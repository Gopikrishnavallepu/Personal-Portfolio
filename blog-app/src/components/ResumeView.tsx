"use client";

import React from 'react';
import { Mail, Briefcase, GraduationCap, Code, Award, Calendar } from 'lucide-react';

export function ResumeView() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 sm:px-12 w-full text-zinc-800 dark:text-zinc-200">
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-8 mb-8">
        <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 mb-2">
          DevSecOps Engineer &amp; Security Analyst
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400">
          Security-focused engineer with expertise in DevSecOps, cloud security, and secure application development.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - Summary & Experience */}
        <div className="md:col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-800/60 pb-2">
              <Briefcase className="w-5 h-5 text-blue-500" />
              Professional Experience
            </h2>
            <div className="space-y-6">
              <div className="relative pl-6 border-l-2 border-zinc-200 dark:border-zinc-800">
                <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-zinc-950" />
                <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-lg">DevSecOps Engineer</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20">
                    2023 - Present
                  </span>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mb-3">Current Role</p>
                <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400 list-disc pl-4">
                  <li>Implemented Software Composition Analysis (SCA) scanning in CI/CD pipelines.</li>
                  <li>Reduced vulnerability resolution time by 40% through automation.</li>
                  <li>Automated compliance reporting and security audits.</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-800/60 pb-2">
              <Code className="w-5 h-5 text-blue-500" />
              Security Projects
            </h2>
            <ul className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="p-4 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">Personal Blog &amp; Portfolio</h4>
                <p>Security learning tracker and DevSecOps playbook portal built with Next.js and GitHub sync capabilities.</p>
              </li>
              <li className="p-4 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">GitHub Security Audit Automation</h4>
                <p>Automated script auditing configuration drift and tracking exposed access tokens in repositories.</p>
              </li>
              <li className="p-4 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">Cloud Infrastructure Security Baselines</h4>
                <p>Terraform templates built in alignment with CIS AWS Foundations benchmarks to secure multi-account environments.</p>
              </li>
            </ul>
          </section>
        </div>

        {/* Right Column - Skills & Education */}
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-800/60 pb-2">
              <Award className="w-5 h-5 text-blue-500" />
              Core Skills
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Security &amp; Compliance</h3>
                <div className="flex flex-wrap gap-1.5">
                  {['AppSec (SAST/DAST)', 'SCA', 'Container Security', 'IaC Security', 'OWASP Top 10', 'CIS Benchmarks', 'NIST Framework'].map(s => (
                    <span key={s} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">DevOps &amp; Cloud</h3>
                <div className="flex flex-wrap gap-1.5">
                  {['GitHub Actions', 'GitLab CI/CD', 'Kubernetes', 'Docker', 'AWS', 'Azure', 'Terraform'].map(s => (
                    <span key={s} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Tools</h3>
                <div className="flex flex-wrap gap-1.5">
                  {['SonarQube', 'Snyk', 'OWASP ZAP', 'Trivy', 'Vault', 'ELK Stack', 'Prometheus'].map(s => (
                    <span key={s} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-800/60 pb-2">
              <GraduationCap className="w-5 h-5 text-blue-500" />
              Education &amp; Certs
            </h2>
            <div className="space-y-4">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Security+ Certification</h4>
                <p className="text-xs text-zinc-500 mt-0.5">CompTIA</p>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Bachelor's in Computer Science</h4>
                <p className="text-xs text-zinc-500 mt-0.5">University Graduate</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="mt-12 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400">
        <p>Last Updated: December 2025</p>
      </div>
    </div>
  );
}
