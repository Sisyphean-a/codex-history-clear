export namespace main {
	
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

