// WAF Detection and Fingerprinting Module
// Two-phase detection: passive (clean request) then active (probe payloads)
// Compares baseline vs probe to eliminate false positives from hosting infrastructure

export interface WAFDetectionResult {
  detected: boolean;
  wafType: string;
  confidence: number;
  evidence: string[];
  suggestedBypassTechniques: string[];
  isActivelyBlocking: boolean;
  hasDefaultSecurity: boolean; // CDN default security blocks obvious probes but evasion probes pass
  baselineStatus?: number;
  probeStatus?: number;
  infrastructure?: string; // CDN/infra detected passively (may differ from blocking WAF)
}

export interface WAFSignature {
  name: string;
  headers: { [key: string]: string | RegExp };
  statusCodes?: number[];
  bodyPatterns?: RegExp[];
  cookiePatterns?: RegExp[];
  responseTime?: {
    min?: number;
    max?: number;
  };
}

interface PassiveResult {
  detected: boolean;
  name: string;
  confidence: number;
  evidence: string[];
  baselineStatus: number;
  baselineHeaders: Map<string, string>;
}

export class WAFDetector {
  /**
   * Safe fetch wrapper that catches ALL errors (including Workers runtime internal errors)
   * and returns null instead of throwing. This prevents Uncaught Error: internal error.
   */
  private static async safeFetch(input: string | URL | Request, init?: RequestInit): Promise<Response | null> {
    try {
      return await fetch(input, init);
    } catch (e) {
      console.warn('safeFetch failed:', (e as Error)?.message || e);
      return null;
    }
  }

  private static readonly WAF_SIGNATURES: WAFSignature[] = [
    // Cloudflare
    {
      name: 'Cloudflare',
      headers: {
        'server': /cloudflare/i,
        'cf-ray': /^[a-f0-9]+-[A-Z]{3}$/,
        'cf-cache-status': /.*/,
        'cf-request-id': /.*/,
      },
      statusCodes: [403, 429],
      bodyPatterns: [
        /cloudflare/i,
        /attention required! \| cloudflare/i,
        /ray id: [a-f0-9]+-[A-Z]{3}/i,
      ],
    },

    // AWS WAF
    {
      name: 'AWS WAF',
      headers: {
        'server': /CloudFront/i,
        'x-amz-cf-id': /.*/,
        'x-amz-cf-pop': /.*/,
        'x-cache': /^(Hit|Miss) from cloudfront$/i,
      },
      statusCodes: [403],
      bodyPatterns: [
        /forbidden.*you don't have permission to access.*on this server/i,
        /request blocked/i,
      ],
    },

    // Imperva/Incapsula
    {
      name: 'Imperva',
      headers: {
        'x-iinfo': /.*/,
        'x-cdn': /Incapsula/i,
        'set-cookie': /incap_ses_|visid_incap_/i,
      },
      statusCodes: [403],
      bodyPatterns: [
        /incapsula/i,
        /request unsuccessful. incapsula incident id/i,
      ],
      cookiePatterns: [
        /incap_ses_\d+/,
        /visid_incap_\d+/,
      ],
    },

    // F5 BIG-IP
    {
      name: 'F5 BIG-IP',
      headers: {
        'server': /BIG-IP/i,
        'x-wa-info': /.*/,
        'f5-trace-id': /.*/,
      },
      statusCodes: [403],
      bodyPatterns: [
        /the requested url was rejected/i,
        /please consult with your administrator/i,
        /your support id is/i,
      ],
    },

    // ModSecurity
    {
      name: 'ModSecurity',
      headers: {
        'server': /mod_security|apache/i,
      },
      statusCodes: [403, 406],
      bodyPatterns: [
        /mod_security/i,
        /not acceptable/i,
        /apache.*forbidden/i,
        /request blocked by security policy/i,
      ],
    },

    // Akamai
    {
      name: 'Akamai',
      headers: {
        'server': /AkamaiGHost/i,
        'akamai-origin-hop': /.*/,
        'x-akamai-transformed': /.*/,
      },
      statusCodes: [403],
      bodyPatterns: [
        /access denied/i,
        /akamai/i,
        /reference #[0-9a-f]+/i,
      ],
    },

    // Barracuda
    {
      name: 'Barracuda',
      headers: {
        'server': /Barracuda/i,
        'x-barracuda-url': /.*/,
      },
      statusCodes: [403],
      bodyPatterns: [
        /barracuda/i,
      ],
    },

    // Sucuri
    {
      name: 'Sucuri',
      headers: {
        'server': /Sucuri/i,
        'x-sucuri-id': /.*/,
        'x-sucuri-cache': /.*/,
      },
      statusCodes: [403],
      bodyPatterns: [
        /sucuri website firewall - access denied/i,
        /questions\? contact us at cloudproxy@sucuri\.net/i,
      ],
    },

    // Fastly
    {
      name: 'Fastly',
      headers: {
        'via': /fastly/i,
        'x-served-by': /cache-.*-fastly/i,
        'x-cache': /(HIT|MISS).*fastly/i,
      },
      statusCodes: [403],
    },

    // KeyCDN
    {
      name: 'KeyCDN',
      headers: {
        'server': /keycdn-engine/i,
        'x-edge-location': /.*/,
      },
      statusCodes: [403],
    },

    // StackPath (MaxCDN)
    {
      name: 'StackPath',
      headers: {
        'server': /NetDNA-cache|stackpath/i,
        'x-hw': /.*/,
      },
      statusCodes: [403],
    },

    // DenyAll
    {
      name: 'DenyAll',
      headers: {
        'server': /denyall/i,
      },
      statusCodes: [403],
      bodyPatterns: [
        /denyall/i,
      ],
    },

    // Fortinet FortiWeb
    {
      name: 'FortiWeb',
      headers: {
        'server': /Fortigate|FortiWeb/i,
      },
      statusCodes: [403],
      bodyPatterns: [
        /web filter violation/i,
        /fortigate/i,
      ],
    },

    // Wallarm
    {
      name: 'Wallarm',
      headers: {
        'server': /nginx-wallarm/i,
        'x-wallarm-instance': /.*/,
      },
      statusCodes: [403, 500],
    },

    // Radware AppWall
    {
      name: 'Radware',
      headers: {
        'server': /Radware|AppWall/i,
        'x-origin-requestid': /.*/,
      },
      statusCodes: [403],
    },

    // Varnish (often used with WAF modules)
    {
      name: 'Varnish',
      headers: {
        'server': /varnish/i,
        'x-varnish': /.*/,
        'via': /varnish/i,
      },
      statusCodes: [403],
    },
  ];

  // =============================================
  // Phase 1: Passive Detection (clean request)
  // =============================================

  /**
   * Send a clean GET request (no payload) and analyze response headers
   * to identify the CDN/WAF infrastructure without triggering any blocking.
   */
  static async passiveDetection(url: string): Promise<PassiveResult> {
    try {
      const response = await this.safeFetch(url, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!response) {
        return {
          detected: false,
          name: 'Unknown',
          confidence: 0,
          evidence: [],
          baselineStatus: 0,
          baselineHeaders: new Map(),
        };
      }

      const baselineHeaders = new Map<string, string>();
      response.headers.forEach((value, key) => {
        baselineHeaders.set(key.toLowerCase(), value);
      });

      // Match headers against signatures (headers only, no status/body for passive)
      let bestMatch = { name: 'Unknown', confidence: 0, evidence: [] as string[] };

      for (const signature of this.WAF_SIGNATURES) {
        let confidence = 0;
        const matchEvidence: string[] = [];

        for (const [headerName, pattern] of Object.entries(signature.headers)) {
          const headerValue = response.headers.get(headerName);
          if (headerValue) {
            if (pattern instanceof RegExp ? pattern.test(headerValue) : headerValue.toLowerCase().includes(pattern.toLowerCase())) {
              confidence += 25;
              matchEvidence.push(`Header ${headerName}: ${headerValue}`);
            }
          }
        }

        // Check cookies for passive detection too
        if (signature.cookiePatterns) {
          const cookies = response.headers.get('set-cookie');
          if (cookies) {
            for (const pattern of signature.cookiePatterns) {
              if (pattern.test(cookies)) {
                confidence += 15;
                matchEvidence.push(`Cookie: ${pattern}`);
              }
            }
          }
        }

        if (confidence > bestMatch.confidence) {
          bestMatch = { name: signature.name, confidence, evidence: matchEvidence };
        }
      }

      return {
        detected: bestMatch.confidence > 0,
        name: bestMatch.name,
        confidence: bestMatch.confidence,
        evidence: bestMatch.evidence,
        baselineStatus: response.status,
        baselineHeaders,
      };
    } catch (error) {
      console.error('Passive detection failed:', error);
      return {
        detected: false,
        name: 'Unknown',
        confidence: 0,
        evidence: [],
        baselineStatus: 0,
        baselineHeaders: new Map(),
      };
    }
  }

  // =============================================
  // Phase 2: Active Detection (with probes)
  // Compares probe response against passive baseline
  // =============================================

  /**
   * Three-phase WAF detection:
   * 1. Passive: clean request to identify CDN/infrastructure
   * 2. Active: obvious probe payloads and compare against baseline
   * 3. Confirmation: evasion probes to distinguish default CDN security from active WAF rules
   */
  static async activeDetection(url: string): Promise<WAFDetectionResult> {
    // Phase 1: passive baseline
    const passive = await this.passiveDetection(url);
    console.log(`Passive detection: ${passive.name} (confidence: ${passive.confidence}, baseline status: ${passive.baselineStatus})`);

    // Phase 2: active probing with obvious payloads
    // Probe payloads are base64-encoded to avoid triggering WAF during deployment
    const probePayloads = [
      atob('JyBPUiAnMSc9JzE='),          // ' OR '1'='1
      atob('PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='), // <script>alert(1)</script>
      atob('Li4vLi4vLi4vZXRjL3Bhc3N3ZA=='),          // ../../../etc/passwd
      atob('VU5JT04gU0VMRUNUIDEsMiwzLS0='),          // UNION SELECT 1,2,3--
    ];

    let probeBlocked = false;
    let probeStatus = 0;
    let bestProbeMatch = { name: 'Unknown', confidence: 0, evidence: [] as string[] };

    for (const payload of probePayloads) {
      try {
        const startTime = Date.now();
        const response = await this.safeFetch(`${url}?test=${encodeURIComponent(payload)}`, {
          method: 'GET',
          redirect: 'manual',
        });
        if (!response) continue;
        const responseTime = Date.now() - startTime;
        const responseBody = await response.text();

        // Check if probe was blocked (status changed from baseline)
        const wasBlocked = passive.baselineStatus < 400 && response.status >= 400;
        if (wasBlocked) {
          probeBlocked = true;
          probeStatus = response.status;

          // Analyze the blocking response, but discount headers already seen in baseline
          const probeMatch = this.analyzeProbeResponse(response, responseBody, responseTime, passive.baselineHeaders);
          if (probeMatch.confidence > bestProbeMatch.confidence) {
            bestProbeMatch = probeMatch;
          }
        }
      } catch (error) {
        console.error('Active detection probe failed:', error);
      }
    }

    // Phase 3: If obvious probes were blocked, run evasion probes to confirm
    // whether this is active WAF rules or just default CDN security
    let confirmedActiveWAF = true; // assume active if no confirmation needed
    if (probeBlocked && passive.detected) {
      console.log('Probes blocked by detected CDN — running evasion confirmation probes...');
      confirmedActiveWAF = await this.confirmActiveWAF(url, passive.baselineStatus);
      console.log(`Evasion confirmation result: ${confirmedActiveWAF ? 'Active WAF (evasion probes also blocked)' : 'Default security only (evasion probes passed)'}`);
    }

    // Decision logic
    return this.buildFinalResult(passive, probeBlocked, probeStatus, bestProbeMatch, confirmedActiveWAF);
  }

  // =============================================
  // Phase 3: Confirmation with evasion probes
  // Distinguishes default CDN security from active WAF rules
  // =============================================

  /**
   * Send evasion probes that bypass default CDN security (pattern matching on obvious attacks)
   * but get caught by actively configured WAF rules (deep decoding, regex, OWASP rules).
   *
   * If evasion probes pass through → only default CDN security (not a real WAF)
   * If evasion probes are also blocked → active WAF rules configured
   */
  private static async confirmActiveWAF(url: string, baselineStatus: number): Promise<boolean> {
    // Evasion payloads — base64-encoded to avoid WAF blocking during deployment
    // These use techniques that bypass basic pattern matching:
    const evasionProbes = [
      atob('MSB1bi8qKi9pb24gc2UvKiovbGVjdCAxLDIsMy0t'), // 1 un/**/ion se/**/lect 1,2,3--  (comment-obfuscated SQL)
      atob('MScgfHwgMT0xLS0='),                           // 1' || 1=1--  (alternative OR syntax)
      atob('PEltZyBTcmM9eCBPbkVycm9yPXByb21wdCgxKT4='), // <Img Src=x OnError=prompt(1)>  (event handler XSS)
      atob('Li4uLi8vLi4uLi8vLi4uLi8vZXRjL3Bhc3N3ZA=='), // ....//....//....//etc/passwd  (double-dot path traversal variant)
    ];

    let blockedCount = 0;

    for (const probe of evasionProbes) {
      try {
        const response = await this.safeFetch(`${url}?q=${encodeURIComponent(probe)}`, {
          method: 'GET',
          redirect: 'manual',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        if (!response) {
          blockedCount++;
          continue;
        }
        if (response.status >= 400 && baselineStatus < 400) {
          blockedCount++;
        }
      } catch {
        // Connection error — may indicate blocking at network level
        blockedCount++;
      }
    }

    // Active WAF confirmed only if most evasion probes are also blocked
    // (default CDN security should let most of these through)
    return blockedCount >= 3;
  }

  /**
   * Analyze a probe response, discounting headers that were already present
   * in the passive baseline (to avoid attributing infrastructure headers to the WAF).
   */
  private static analyzeProbeResponse(
    response: Response,
    responseBody: string,
    responseTime: number,
    baselineHeaders: Map<string, string>,
  ): { name: string; confidence: number; evidence: string[] } {
    let bestMatch = { name: 'Unknown', confidence: 0, evidence: [] as string[] };

    for (const signature of this.WAF_SIGNATURES) {
      let confidence = 0;
      const matchEvidence: string[] = [];

      // Check headers — but only count those NOT present in baseline
      for (const [headerName, pattern] of Object.entries(signature.headers)) {
        const headerValue = response.headers.get(headerName);
        if (headerValue) {
          const wasInBaseline = baselineHeaders.has(headerName.toLowerCase());
          const matches = pattern instanceof RegExp ? pattern.test(headerValue) : headerValue.toLowerCase().includes(pattern.toLowerCase());

          if (matches) {
            if (wasInBaseline) {
              // Header was already in clean response — infrastructure, not WAF blocking
              // Give minimal weight
              confidence += 5;
              matchEvidence.push(`Header ${headerName}: ${headerValue} (also in clean response — infrastructure)`);
            } else {
              // New header appearing only in blocked response — strong WAF signal
              confidence += 35;
              matchEvidence.push(`Header ${headerName}: ${headerValue} (new in blocked response)`);
            }
          }
        }
      }

      // Status code matching — strong signal when probe is blocked
      if (signature.statusCodes && signature.statusCodes.includes(response.status)) {
        confidence += 15;
        matchEvidence.push(`Blocked with status: ${response.status}`);
      }

      // Body patterns — strong signal in blocked responses
      if (responseBody && signature.bodyPatterns) {
        for (const pattern of signature.bodyPatterns) {
          if (pattern.test(responseBody)) {
            confidence += 25;
            matchEvidence.push(`Block page pattern: ${pattern}`);
          }
        }
      }

      // Cookie patterns
      if (signature.cookiePatterns) {
        const cookies = response.headers.get('set-cookie');
        if (cookies) {
          for (const pattern of signature.cookiePatterns) {
            if (pattern.test(cookies)) {
              confidence += 15;
              matchEvidence.push(`WAF cookie: ${pattern}`);
            }
          }
        }
      }

      if (confidence > bestMatch.confidence) {
        bestMatch = { name: signature.name, confidence, evidence: matchEvidence };
      }
    }

    return bestMatch;
  }

  /**
   * Build the final detection result by combining passive, active, and confirmation phases.
   */
  private static buildFinalResult(
    passive: PassiveResult,
    probeBlocked: boolean,
    probeStatus: number,
    probeMatch: { name: string; confidence: number; evidence: string[] },
    confirmedActiveWAF: boolean = true,
  ): WAFDetectionResult {

    // Case 1: Probes blocked AND evasion probes also blocked → Active WAF rules
    if (probeBlocked && confirmedActiveWAF) {
      let wafType: string;
      let confidence: number;
      let evidence: string[];

      if (probeMatch.confidence >= 40) {
        wafType = probeMatch.name;
        confidence = Math.min(probeMatch.confidence, 100);
        evidence = probeMatch.evidence;
      } else if (passive.detected) {
        wafType = passive.name;
        confidence = Math.min(passive.confidence + 20, 100);
        evidence = [
          ...passive.evidence,
          `Probes blocked (${passive.baselineStatus} → ${probeStatus})`,
          `Evasion probes also blocked — active WAF rules confirmed`,
          `Infrastructure ${passive.name} has configured WAF rules`,
        ];
      } else {
        wafType = probeMatch.name !== 'Unknown' ? probeMatch.name : 'Unknown WAF';
        confidence = Math.max(probeMatch.confidence, 30);
        evidence = [
          `Probes blocked (${passive.baselineStatus} → ${probeStatus})`,
          ...probeMatch.evidence,
        ];
      }

      return {
        detected: true,
        wafType,
        confidence,
        evidence,
        suggestedBypassTechniques: this.getSuggestedBypassTechniques(wafType),
        isActivelyBlocking: true,
        hasDefaultSecurity: false,
        baselineStatus: passive.baselineStatus,
        probeStatus,
        infrastructure: passive.detected ? passive.name : undefined,
      };
    }

    // Case 2: Probes blocked BUT evasion probes passed → Default CDN security only
    if (probeBlocked && !confirmedActiveWAF) {
      const cdnName = passive.detected ? passive.name : 'Unknown CDN';
      return {
        detected: true,
        wafType: cdnName,
        confidence: Math.min(passive.confidence, 50), // Cap lower — it's just default security
        evidence: [
          ...passive.evidence,
          `Obvious probes blocked (${passive.baselineStatus} → ${probeStatus})`,
          `Evasion probes passed through — no active WAF rules detected`,
          `${cdnName} default/standard security is blocking obvious attack patterns`,
          `This is normal CDN behavior, not a configured WAF`,
        ],
        suggestedBypassTechniques: [],
        isActivelyBlocking: false,
        hasDefaultSecurity: true,
        baselineStatus: passive.baselineStatus,
        probeStatus,
        infrastructure: passive.detected ? passive.name : undefined,
      };
    }

    // Case 3: Probes NOT blocked — CDN present but not blocking
    if (passive.detected && passive.confidence >= 25) {
      return {
        detected: true,
        wafType: passive.name,
        confidence: Math.min(passive.confidence, 70),
        evidence: [
          ...passive.evidence,
          'Infrastructure detected but probes were NOT blocked',
          `Baseline status: ${passive.baselineStatus}, Probe status: same (not blocked)`,
        ],
        suggestedBypassTechniques: [],
        isActivelyBlocking: false,
        hasDefaultSecurity: false,
        baselineStatus: passive.baselineStatus,
        probeStatus: passive.baselineStatus,
        infrastructure: passive.name,
      };
    }

    // Case 4: Nothing detected
    return {
      detected: false,
      wafType: 'Unknown',
      confidence: 0,
      evidence: [
        `Baseline status: ${passive.baselineStatus}`,
        'No WAF signatures found in headers',
        'Probes were not blocked',
      ],
      suggestedBypassTechniques: [],
      isActivelyBlocking: false,
      hasDefaultSecurity: false,
      baselineStatus: passive.baselineStatus,
      probeStatus: passive.baselineStatus,
    };
  }

  /**
   * Detect WAF from HTTP response (kept for compatibility with check-stream)
   */
  static async detectFromResponse(
    response: Response,
    responseBody?: string,
    responseTime?: number
  ): Promise<WAFDetectionResult> {
    const evidence: string[] = [];
    let bestMatch = {
      name: 'Unknown',
      confidence: 0,
      evidence: [] as string[],
    };

    for (const signature of this.WAF_SIGNATURES) {
      let confidence = 0;
      const matchEvidence: string[] = [];

      // Check headers
      for (const [headerName, pattern] of Object.entries(signature.headers)) {
        const headerValue = response.headers.get(headerName);
        if (headerValue) {
          if (typeof pattern === 'string') {
            if (headerValue.toLowerCase().includes(pattern.toLowerCase())) {
              confidence += 30;
              matchEvidence.push(`Header ${headerName}: ${headerValue}`);
            }
          } else if (pattern instanceof RegExp) {
            if (pattern.test(headerValue)) {
              confidence += 30;
              matchEvidence.push(`Header ${headerName}: ${headerValue}`);
            }
          }
        }
      }

      // Check status codes
      if (signature.statusCodes && signature.statusCodes.includes(response.status)) {
        confidence += 20;
        matchEvidence.push(`Status code: ${response.status}`);
      }

      // Check response body patterns
      if (responseBody && signature.bodyPatterns) {
        for (const pattern of signature.bodyPatterns) {
          if (pattern.test(responseBody)) {
            confidence += 25;
            matchEvidence.push(`Body pattern: ${pattern}`);
          }
        }
      }

      // Check cookie patterns
      if (signature.cookiePatterns) {
        const cookies = response.headers.get('set-cookie');
        if (cookies) {
          for (const pattern of signature.cookiePatterns) {
            if (pattern.test(cookies)) {
              confidence += 20;
              matchEvidence.push(`Cookie pattern: ${pattern}`);
            }
          }
        }
      }

      if (confidence > bestMatch.confidence) {
        bestMatch = {
          name: signature.name,
          confidence,
          evidence: matchEvidence,
        };
      }
    }

    const detected = bestMatch.confidence > 40;
    const suggestedBypassTechniques = this.getSuggestedBypassTechniques(bestMatch.name);

    return {
      detected,
      wafType: detected ? bestMatch.name : 'Unknown',
      confidence: bestMatch.confidence,
      evidence: bestMatch.evidence,
      suggestedBypassTechniques,
      isActivelyBlocking: detected,
      hasDefaultSecurity: false,
    };
  }

  /**
   * Get suggested bypass techniques for detected WAF
   */
  private static getSuggestedBypassTechniques(wafType: string): string[] {
    const techniques: { [key: string]: string[] } = {
      'Cloudflare': [
        'Unicode encoding (\\u0027 instead of \')',
        'Double URL encoding (%2527 instead of %27)',
        'Mixed case keywords (uNiOn instead of UNION)',
        'Alternative space characters (\\u00A0)',
        'Comment-based obfuscation (/**/)',
      ],
      'AWS WAF': [
        'Unicode normalization bypasses',
        'Character set encoding variations',
        'Request method variations',
        'Content-Type manipulation',
      ],
      'Imperva': [
        'Parameter pollution',
        'HTTP verb tampering',
        'Custom header injection',
        'Encoding combinations',
      ],
      'F5 BIG-IP': [
        'Request smuggling techniques',
        'HTTP/1.0 downgrade',
        'Custom User-Agent strings',
      ],
      'ModSecurity': [
        'Comment-based SQL obfuscation',
        'Case sensitivity exploits',
        'Regex pattern bypasses',
        'Alternative operators',
      ],
      'Akamai': [
        'IP-based bypasses',
        'Origin server direct access',
        'Cache poisoning techniques',
      ],
      'Generic WAF': [
        'Double URL encoding',
        'Unicode encoding',
        'Mixed case obfuscation',
        'Comment insertion',
        'Parameter pollution',
        'HTTP verb tampering',
      ],
    };

    return techniques[wafType] || techniques['Generic WAF'];
  }

  /**
   * Detect WAF bypass opportunities
   */
  static async detectBypassOpportunities(url: string): Promise<{
    httpMethodsBypass: boolean;
    headerBypass: boolean;
    encodingBypass: boolean;
    parameterPollution: boolean;
  }> {
    const opportunities = {
      httpMethodsBypass: false,
      headerBypass: false,
      encodingBypass: false,
      parameterPollution: false,
    };

    try {
      // Test HTTP method bypass
      const methodResponse = await this.safeFetch(url, { method: 'TRACE', redirect: 'manual' });
      if (methodResponse && methodResponse.status !== 405) {
        opportunities.httpMethodsBypass = true;
      }

      // Test header bypass with X-Original-URL
      const headerResponse = await this.safeFetch(url, {
        method: 'GET',
        headers: { 'X-Original-URL': '/admin' },
        redirect: 'manual',
      });
      if (headerResponse && headerResponse.status === 200) {
        opportunities.headerBypass = true;
      }

      // Test encoding bypass
      const encodedPayload = '%2527%2520OR%25201%253D1';
      const encodingResponse = await this.safeFetch(`${url}?test=${encodedPayload}`, {
        method: 'GET',
        redirect: 'manual',
      });
      if (encodingResponse && encodingResponse.status === 200) {
        opportunities.encodingBypass = true;
      }

      // Test parameter pollution
      const pollutionResponse = await this.safeFetch(`${url}?test=safe&test=malicious`, {
        method: 'GET',
        redirect: 'manual',
      });
      if (pollutionResponse && pollutionResponse.status === 200) {
        opportunities.parameterPollution = true;
      }
    } catch (error) {
      console.error('Bypass opportunity detection failed:', error);
    }

    return opportunities;
  }
}
