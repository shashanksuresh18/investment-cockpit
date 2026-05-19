// ── Shared utility ──────────────────────────────────────────────────────────

export type ApiResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: string };

// ── Search ───────────────────────────────────────────────────────────────────

export type SearchResult = {
  readonly id: string;
  readonly name: string;
  readonly displayName?: string;
  readonly subtitle?: string;
  readonly source?: string;
  readonly ticker?: string | null;
  readonly companyNumber?: string;
  readonly jurisdiction?: string;
  readonly description?: string;
  readonly canUseAnalyze?: boolean;
};

// ── Finnhub ───────────────────────────────────────────────────────────────────

export type FinnhubBasicFinancialMetricSet = {
  readonly '52WeekHigh': number | null;
  readonly '52WeekLow': number | null;
  readonly marketCapitalization: number | null;
  readonly peBasicExclExtraTTM: number | null;
  readonly peTTM: number | null;
  readonly pbAnnual: number | null;
  readonly psTTM: number | null;
  readonly ev: number | null;
  readonly evEbitdaTTM: number | null;
  readonly netMarginTTM: number | null;
  readonly netMarginAnnual: number | null;
  readonly operatingMarginTTM: number | null;
  readonly operatingMarginAnnual: number | null;
  readonly roeTTM: number | null;
  readonly roaTTM: number | null;
  readonly revenueGrowthTTMYoy: number | null;
  readonly epsGrowthTTMYoy: number | null;
};

export type FinnhubBasicFinancials = {
  readonly metric: FinnhubBasicFinancialMetricSet;
};

export type FinnhubQuote = {
  readonly c: number;
  readonly d: number | null;
  readonly dp: number | null;
  readonly h: number;
  readonly l: number;
  readonly o: number;
  readonly pc: number;
  readonly t: number;
};

export type FinnhubSymbolMatch = {
  readonly symbol: string;
  readonly description: string;
  readonly type: string;
  readonly displaySymbol?: string;
  readonly figi?: string;
};

export type FinnhubSymbolSearchResponse = {
  readonly count: number;
  readonly result: readonly FinnhubSymbolMatch[];
};

export type FinnhubRecommendation = {
  readonly buy: number;
  readonly hold: number;
  readonly period: string;
  readonly sell: number;
  readonly strongBuy: number;
  readonly strongSell: number;
  readonly symbol: string;
};

export type FinnhubNewsItem = {
  readonly category: string;
  readonly datetime: number;
  readonly headline: string;
  readonly id: number;
  readonly image: string;
  readonly related: string;
  readonly source: string;
  readonly summary: string;
  readonly url: string;
};

export type FinnhubPriceTarget = {
  readonly targetHigh: number | null;
  readonly targetLow: number | null;
  readonly targetMean: number | null;
  readonly targetMedian: number | null;
  readonly lastUpdated?: string;
};

export type FinnhubEarningsEvent = {
  readonly actual: number | null;
  readonly estimate: number | null;
  readonly period: string;
  readonly quarter?: number;
  readonly year?: number;
  readonly surprise: number | null;
  readonly surprisePercent: number | null;
};

export type FinnhubInsiderTransaction = {
  readonly name: string;
  readonly share: number | null;
  readonly change: number | null;
  readonly filingDate?: string;
  readonly transactionDate: string;
  readonly transactionCode: string;
  readonly transactionPrice: number | null;
};

export type FinnhubData = {
  readonly symbol: string;
  readonly symbolType: string;
  readonly companyName: string | null;
  readonly quote: FinnhubQuote | null;
  readonly recommendations: readonly FinnhubRecommendation[];
  readonly news: readonly FinnhubNewsItem[];
  readonly basicFinancials: FinnhubBasicFinancials | null;
  readonly priceTarget: FinnhubPriceTarget | null;
  readonly priceTargetNote?: string;
  readonly earnings: readonly FinnhubEarningsEvent[];
  readonly insiderTransactions: readonly FinnhubInsiderTransaction[];
  readonly isAmbiguous: boolean;
  readonly alternatives: readonly FinnhubSymbolMatch[];
};

// ── FMP ───────────────────────────────────────────────────────────────────────

export type FmpHistoricalMultiple = {
  readonly date: string;
  readonly peRatio: number | null;
  readonly pbRatio: number | null;
  readonly evToEbitda: number | null;
  readonly evToSales: number | null;
};

export type FmpEnterpriseValue = {
  readonly date: string;
  readonly enterpriseValue: number | null;
  readonly marketCapitalization: number | null;
  readonly stockPrice: number | null;
};

export type FmpAnalystEstimate = {
  readonly date: string;
  readonly estimatedRevenueAvg: number | null;
  readonly estimatedEpsAvg: number | null;
};

export type FmpPriceTargetConsensus = {
  readonly targetHigh: number | null;
  readonly targetLow: number | null;
  readonly targetMedian: number | null;
  readonly targetConsensus: number | null;
};

export type FmpPeerProfile = {
  readonly symbol: string;
  readonly companyName: string;
  readonly currentPrice: number | null;
  readonly marketCap: number | null;
  readonly peRatio: number | null;
  readonly revenueGrowth: number | null;
  readonly evToEbitda: number | null;
};

export type FmpData = {
  readonly symbol: string;
  readonly companyName: string | null;
  readonly historicalMultiples: readonly FmpHistoricalMultiple[];
  readonly enterpriseValues: readonly FmpEnterpriseValue[];
  readonly analystEstimates: readonly FmpAnalystEstimate[];
  readonly priceTargetConsensus: FmpPriceTargetConsensus | null;
  readonly peers: readonly FmpPeerProfile[];
  readonly note?: string;
};

// ── SEC EDGAR ─────────────────────────────────────────────────────────────────

export type SecCompanyInfo = {
  readonly cik: string;
  readonly name: string;
  readonly sic: string;
  readonly sicDescription: string;
  readonly tickers: readonly string[];
  readonly exchanges: readonly string[];
  readonly filings: {
    readonly recent: {
      readonly accessionNumber: readonly string[];
      readonly filingDate: readonly string[];
      readonly form: readonly string[];
      readonly primaryDocument: readonly string[];
      readonly primaryDocDescription: readonly string[];
    };
  };
};

export type SecFiling = {
  readonly accessionNumber: string;
  readonly filingDate: string;
  readonly form: string;
  readonly primaryDocument: string;
  readonly primaryDocDescription: string;
};

export type SecXbrlFact = {
  readonly val: number;
  readonly accn: string;
  readonly fy: number | null;
  readonly fp: string;
  readonly form: string;
  readonly filed: string;
  readonly frame: string | null;
  readonly start?: string;
  readonly end: string;
};

export type SecXbrlUnit = Record<string, readonly SecXbrlFact[]>;

export type SecXbrlConcept = {
  readonly label: string;
  readonly description: string;
  readonly units: SecXbrlUnit;
};

export type SecXbrlFacts = {
  readonly cik: number;
  readonly entityName: string;
  readonly facts: {
    readonly 'us-gaap'?: Record<string, SecXbrlConcept>;
    readonly dei?: Record<string, SecXbrlConcept>;
    readonly 'ifrs-full'?: Record<string, SecXbrlConcept>;
  };
};

export type SecEdgarData = {
  readonly cik: string;
  readonly companyInfo: SecCompanyInfo | null;
  readonly recentFilings: readonly SecFiling[];
  readonly xbrlFacts: SecXbrlFacts | null;
};

// ── Companies House ───────────────────────────────────────────────────────────

export type CompaniesHouseAddress = {
  readonly address_line_1?: string;
  readonly address_line_2?: string;
  readonly locality?: string;
  readonly postal_code?: string;
  readonly country?: string;
};

export type CompaniesHouseAccounts = {
  readonly accounting_reference_date?: {
    readonly day?: string;
    readonly month?: string;
  };
  readonly last_accounts?: {
    readonly made_up_to?: string;
    readonly period_start_on?: string;
    readonly period_end_on?: string;
    readonly type?: string;
  };
  readonly next_accounts?: {
    readonly due_on?: string;
    readonly overdue?: boolean;
    readonly period_start_on?: string;
    readonly period_end_on?: string;
  };
  readonly next_due?: string;
};

export type CompaniesHouseCompany = {
  readonly company_number: string;
  readonly company_name: string;
  readonly company_status: string;
  readonly company_type: string;
  readonly date_of_creation: string;
  readonly description: string;
  readonly registered_office_address: CompaniesHouseAddress;
};

export type CompaniesHouseProfile = {
  readonly company_number: string;
  readonly company_name: string;
  readonly company_status: string;
  readonly company_type: string;
  readonly date_of_creation?: string;
  readonly jurisdiction?: string;
  readonly sic_codes: readonly string[];
  readonly registered_office_address: CompaniesHouseAddress;
  readonly accounts: CompaniesHouseAccounts | null;
};

export type CompaniesHouseFiling = {
  readonly date: string;
  readonly category: string;
  readonly type: string;
  readonly description: string;
  readonly pages?: number;
  readonly document_metadata?: string;
};

export type CompaniesHouseSearchResponse = {
  readonly items: readonly CompaniesHouseCompany[];
  readonly total_results: number;
  readonly start_index: number;
  readonly items_per_page: number;
  readonly kind: string;
};

export type CompaniesHouseData = {
  readonly company: CompaniesHouseCompany | null;
  readonly allMatches: readonly CompaniesHouseCompany[];
  readonly profile: CompaniesHouseProfile | null;
  readonly accountsFilings: readonly CompaniesHouseFiling[];
};

// ── GLEIF ─────────────────────────────────────────────────────────────────────

export type GleifAddress = {
  readonly lang: string;
  readonly addressLines: readonly string[];
  readonly city: string;
  readonly region?: string;
  readonly country: string;
  readonly postalCode?: string;
};

export type GleifEntity = {
  readonly legalName: { readonly name: string; readonly language: string };
  readonly legalAddress: GleifAddress;
  readonly headquartersAddress: GleifAddress;
  readonly otherNames: readonly {
    readonly name: string;
    readonly language: string;
  }[];
  readonly jurisdiction: string;
  readonly category: string;
  readonly legalForm: { readonly id: string };
  readonly registeredAt?: { readonly id: string };
};

export type GleifRegistration = {
  readonly initialRegistrationDate: string;
  readonly lastUpdateDate: string;
  readonly status: string;
  readonly nextRenewalDate: string;
  readonly managingLou: string;
};

export type GleifRecord = {
  readonly type: string;
  readonly id: string;
  readonly attributes: {
    readonly lei: string;
    readonly entity: GleifEntity;
    readonly registration: GleifRegistration;
  };
};

export type GleifSearchResponse = {
  readonly data: readonly GleifRecord[];
  readonly meta: {
    readonly total: number;
    readonly page: number;
  };
};

export type GleifData = {
  readonly record: GleifRecord | null;
  readonly allMatches: readonly GleifRecord[];
};

// ── Exa Deep ──────────────────────────────────────────────────────────────────

export type ExaDeepData = {
  readonly companyName: string;
  readonly overview: string;
  readonly estimatedRevenue: string | null;
  readonly fundingTotal: string | null;
  readonly lastValuation: string | null;
  readonly foundedYear: string | null;
  readonly headquarters: string | null;
  readonly keyInvestors: readonly string[];
  readonly competitors: readonly string[];
  readonly recentNews: string;
};

// ── IR Documents ──────────────────────────────────────────────────────────────

export type IRDocumentType =
  | 'earnings-release'
  | 'presentation'
  | 'press-release'
  | 'annual-report'
  | 'other';

export type IRDocument = {
  readonly title: string;
  readonly url: string;
  readonly publisher: string;
  readonly publicationDate: string;
  readonly documentType: IRDocumentType;
};

// ── PDF Extract ───────────────────────────────────────────────────────────────

export type PDFExtract = {
  readonly url: string;
  readonly title: string;
  readonly extractedAt: string;
  readonly revenue: number | null;
  readonly ebitda: number | null;
  readonly netIncome: number | null;
  readonly keyMetrics: Record<string, string>;
  readonly rawSummary: string;
};

// ── Cockpit core types ────────────────────────────────────────────────────────

export type Verdict =
  | 'Buy'
  | 'Watch'
  | 'Sell'
  | 'Avoid'
  | 'Speculative Buy';

export type ScoreItem = {
  readonly score: number;
  readonly detail: string;
};

export type CockpitScores = {
  readonly conviction: ScoreItem;
  readonly dataConfidence: ScoreItem;
  readonly sourceFreshness: ScoreItem;
};

export type KPIMetric = {
  readonly metric: string;
  readonly value: string;
  readonly detail: string;
};

export type ThesisQuadrant = {
  readonly marketLikes: readonly string[];
  readonly marketDislikes: readonly string[];
  readonly whatIsPricedIn: readonly string[];
  readonly whyUnderPressure: readonly string[];
};

export type ScenarioName = 'Bull' | 'Base' | 'Bear' | 'Kill';

export type Scenario = {
  readonly name: ScenarioName;
  readonly stance: string;
  readonly summary: string;
  readonly priceRange?: string;
};

export type NextCatalyst = {
  readonly eventName: string;
  readonly expectedDate: string;
  readonly watchItems: readonly string[];
};

export type SourceStatus = 'analyzed' | 'not_analyzed' | 'partial';

export type CockpitSource = {
  readonly title: string;
  readonly publisher: string;
  readonly publicationDate: string;
  readonly freshnessScore: number;
  readonly confidenceScore: number;
  readonly url: string;
  readonly status: SourceStatus;
};

export type ValuationData = {
  readonly price: number | null;
  readonly week52High: number | null;
  readonly week52Low: number | null;
  readonly marketCap: number | null;
  readonly enterpriseValue: number | null;
  readonly evRevenue: number | null;
  readonly evEbitda: number | null;
  readonly pe: number | null;
  readonly analystMedianPT: number | null;
  readonly analystUpside: number | null;
  readonly buyCount: number;
  readonly holdCount: number;
  readonly sellCount: number;
};

export type PeerComp = {
  readonly ticker: string;
  readonly companyName: string;
  readonly marketCap: number | null;
  readonly evRevenue: number | null;
  readonly evEbitda: number | null;
  readonly pe: number | null;
  readonly revenueGrowth: number | null;
};

export type ConsensusLabel = 'Bullish' | 'Neutral' | 'Bearish';

export type AnalystConsensus = {
  readonly strongBuy: number;
  readonly buy: number;
  readonly hold: number;
  readonly sell: number;
  readonly strongSell: number;
  readonly medianPT: number | null;
  readonly highPT: number | null;
  readonly lowPT: number | null;
  readonly consensusLabel: ConsensusLabel;
};

export type DataConfidenceClass = 'high' | 'medium' | 'low';

export type CockpitReport = {
  readonly company: string;
  readonly ticker: string | null;
  readonly exchange: string | null;
  readonly verdict: Verdict;
  readonly verdictDetail: string;
  readonly price: number | null;
  readonly priceAsOf: string | null;
  readonly lastCoreSourceDate: string | null;
  readonly scores: CockpitScores;
  readonly kpiBand: readonly KPIMetric[];
  readonly coreDebate: string;
  readonly thesisQuadrant: ThesisQuadrant;
  readonly scenarios: readonly Scenario[];
  readonly missingData: readonly string[];
  readonly nextCatalyst: NextCatalyst | null;
  readonly sourceLibrary: readonly CockpitSource[];
  readonly valuation: ValuationData | null;
  readonly peerComps: readonly PeerComp[];
  readonly analystConsensus: AnalystConsensus | null;
  readonly fullMemo: string;
  readonly generatedAt: string;
  readonly dataConfidenceClass: DataConfidenceClass;
};

// ── Cockpit engine intermediate ───────────────────────────────────────────────

export type CockpitData = {
  readonly company: string;
  readonly ticker: string | null;
  readonly exchange: string | null;
  readonly price: number | null;
  readonly priceAsOf: string | null;
  readonly lastCoreSourceDate: string | null;
  readonly fmp: FmpData | null;
  readonly finnhub: FinnhubData | null;
  readonly sec: SecEdgarData | null;
  readonly companiesHouse: CompaniesHouseData | null;
  readonly gleif: GleifData | null;
  readonly exaDeep: ExaDeepData | null;
  readonly irDocuments: readonly IRDocument[];
  readonly pdfExtracts: readonly PDFExtract[];
  readonly earningsAnalysis: EarningsAnalysis | null;
  readonly marketResearch: MarketResearch | null;
  readonly dataConfidenceClass: DataConfidenceClass;
};

// ── API ───────────────────────────────────────────────────────────────────────

export type CockpitRequest = {
  readonly company: string;
};

export type CockpitResponse = {
  readonly report: CockpitReport;
  readonly cached: boolean;
};

// ── Component props ───────────────────────────────────────────────────────────

export type SearchBarProps = {
  readonly onSearch: (query: string) => void;
  readonly isLoading?: boolean;
  readonly initialQuery?: string;
};

export type CockpitViewProps = {
  readonly report: CockpitReport;
};

export type VerdictHeaderProps = {
  readonly company: string;
  readonly ticker: string | null;
  readonly exchange: string | null;
  readonly verdict: Verdict;
  readonly verdictDetail: string;
  readonly price: number | null;
  readonly priceAsOf: string | null;
  readonly lastCoreSourceDate: string | null;
};

export type ScoreCardsProps = {
  readonly scores: CockpitScores;
};

export type KPIBandProps = {
  readonly kpiBand: readonly KPIMetric[];
};

export type CoreDebateProps = {
  readonly coreDebate: string;
};

export type ThesisQuadrantProps = {
  readonly quadrant: ThesisQuadrant;
};

export type ScenarioGridProps = {
  readonly scenarios: readonly Scenario[];
};

export type ValuationPanelProps = {
  readonly valuation: ValuationData;
};

export type PeerCompTableProps = {
  readonly peerComps: readonly PeerComp[];
};

export type AnalystConsensusProps = {
  readonly consensus: AnalystConsensus;
};

export type MissingDataProps = {
  readonly missingData: readonly string[];
};

export type NextCatalystProps = {
  readonly catalyst: NextCatalyst;
};

export type SourceLibraryProps = {
  readonly sources: readonly CockpitSource[];
};

export type FullMemoProps = {
  readonly memo: string;
};

// ── Skill-layer research types ────────────────────────────────────────────────

export type EarningsAnalysis = {
  readonly period: string;
  readonly revenueActual: number | null;
  readonly revenueEstimate: number | null;
  readonly revenueBeatMiss: 'beat' | 'miss' | 'in-line' | null;
  readonly epsActual: number | null;
  readonly epsEstimate: number | null;
  readonly epsBeatMiss: 'beat' | 'miss' | 'in-line' | null;
  readonly keyMetrics: Record<string, string>;
  readonly managementCommentary: string;
  readonly analystTake: string;
  readonly updatedOutlook: string;
  readonly guidanceRevision: 'raised' | 'lowered' | 'maintained' | 'none' | null;
  readonly riskFlags: readonly string[];
  readonly sourcedFrom: readonly string[];
};

export type SectorComp = {
  readonly ticker: string;
  readonly name: string;
  readonly evRevenue: string | null;
  readonly evEbitda: string | null;
  readonly pe: string | null;
  readonly revenueGrowth: string | null;
  readonly note: string;
};

export type MarketResearch = {
  readonly sector: string;
  readonly sectorOverview: string;
  readonly competitiveLandscape: string;
  readonly positioningVsPeers: string;
  readonly tradingComps: readonly SectorComp[];
  readonly thematicTailwinds: readonly string[];
  readonly thematicHeadwinds: readonly string[];
  readonly sourcedFrom: readonly string[];
};
