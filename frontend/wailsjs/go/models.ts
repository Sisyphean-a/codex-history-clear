export namespace main {
	
	export class DeletePlanItem {
	    duplicateGroup: string;
	    sessionUid?: string;
	    sourcePath: string;
	    preferredPath: string;
	    action: string;
	    reasonCode: string;
	    reason: string;
	    requiresCli: boolean;
	    reviewNeeded: boolean;
	    quarantinePath?: string;
	    warnings: string[];
	
	    static createFrom(source: any = {}) {
	        return new DeletePlanItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.duplicateGroup = source["duplicateGroup"];
	        this.sessionUid = source["sessionUid"];
	        this.sourcePath = source["sourcePath"];
	        this.preferredPath = source["preferredPath"];
	        this.action = source["action"];
	        this.reasonCode = source["reasonCode"];
	        this.reason = source["reason"];
	        this.requiresCli = source["requiresCli"];
	        this.reviewNeeded = source["reviewNeeded"];
	        this.quarantinePath = source["quarantinePath"];
	        this.warnings = source["warnings"];
	    }
	}
	export class GroupCandidate {
	    sessionUid?: string;
	    threadUid?: string;
	    storageKind: string;
	    sourcePath: string;
	    canonicalPath: string;
	    realPath: string;
	    updatedAt: string;
	    preferred: boolean;
	    relation: string;
	    action: string;
	    reasonCode: string;
	    reason: string;
	    requiresCli: boolean;
	    reviewNeeded: boolean;
	    quarantinePath?: string;
	    warnings: string[];
	
	    static createFrom(source: any = {}) {
	        return new GroupCandidate(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.sessionUid = source["sessionUid"];
	        this.threadUid = source["threadUid"];
	        this.storageKind = source["storageKind"];
	        this.sourcePath = source["sourcePath"];
	        this.canonicalPath = source["canonicalPath"];
	        this.realPath = source["realPath"];
	        this.updatedAt = source["updatedAt"];
	        this.preferred = source["preferred"];
	        this.relation = source["relation"];
	        this.action = source["action"];
	        this.reasonCode = source["reasonCode"];
	        this.reason = source["reason"];
	        this.requiresCli = source["requiresCli"];
	        this.reviewNeeded = source["reviewNeeded"];
	        this.quarantinePath = source["quarantinePath"];
	        this.warnings = source["warnings"];
	    }
	}
	export class DuplicateGroup {
	    duplicateGroup: string;
	    preferredPath: string;
	    reviewNeeded: boolean;
	    warning: string;
	    candidates: GroupCandidate[];
	
	    static createFrom(source: any = {}) {
	        return new DuplicateGroup(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.duplicateGroup = source["duplicateGroup"];
	        this.preferredPath = source["preferredPath"];
	        this.reviewNeeded = source["reviewNeeded"];
	        this.warning = source["warning"];
	        this.candidates = this.convertValues(source["candidates"], GroupCandidate);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class PlanSummary {
	    groupCount: number;
	    candidateCount: number;
	    reviewCount: number;
	    plannedCount: number;
	
	    static createFrom(source: any = {}) {
	        return new PlanSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.groupCount = source["groupCount"];
	        this.candidateCount = source["candidateCount"];
	        this.reviewCount = source["reviewCount"];
	        this.plannedCount = source["plannedCount"];
	    }
	}
	export class DeletePlanResult {
	    runId: string;
	    manifestPath: string;
	    duplicateGroupsPath: string;
	    deletePlanPath: string;
	    summary: PlanSummary;
	    groups: DuplicateGroup[];
	    items: DeletePlanItem[];
	    warnings: string[];
	
	    static createFrom(source: any = {}) {
	        return new DeletePlanResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.runId = source["runId"];
	        this.manifestPath = source["manifestPath"];
	        this.duplicateGroupsPath = source["duplicateGroupsPath"];
	        this.deletePlanPath = source["deletePlanPath"];
	        this.summary = this.convertValues(source["summary"], PlanSummary);
	        this.groups = this.convertValues(source["groups"], DuplicateGroup);
	        this.items = this.convertValues(source["items"], DeletePlanItem);
	        this.warnings = source["warnings"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class DiscoveryItem {
	    sourceRoot: string;
	    path: string;
	    kind: string;
	    size: number;
	    mtimeUtc: string;
	    attributes: string[];
	    linkType?: string;
	    target?: string;
	
	    static createFrom(source: any = {}) {
	        return new DiscoveryItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.sourceRoot = source["sourceRoot"];
	        this.path = source["path"];
	        this.kind = source["kind"];
	        this.size = source["size"];
	        this.mtimeUtc = source["mtimeUtc"];
	        this.attributes = source["attributes"];
	        this.linkType = source["linkType"];
	        this.target = source["target"];
	    }
	}
	
	
	
	export class ScanSummary {
	    rootCount: number;
	    itemCount: number;
	    unknownCount: number;
	
	    static createFrom(source: any = {}) {
	        return new ScanSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.rootCount = source["rootCount"];
	        this.itemCount = source["itemCount"];
	        this.unknownCount = source["unknownCount"];
	    }
	}
	export class ScanResult {
	    runId: string;
	    roots: string[];
	    discoveryPath: string;
	    manifestPath: string;
	    unknownItemsPath: string;
	    summary: ScanSummary;
	    items: DiscoveryItem[];
	
	    static createFrom(source: any = {}) {
	        return new ScanResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.runId = source["runId"];
	        this.roots = source["roots"];
	        this.discoveryPath = source["discoveryPath"];
	        this.manifestPath = source["manifestPath"];
	        this.unknownItemsPath = source["unknownItemsPath"];
	        this.summary = this.convertValues(source["summary"], ScanSummary);
	        this.items = this.convertValues(source["items"], DiscoveryItem);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

