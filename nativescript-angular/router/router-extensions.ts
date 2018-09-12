import { Injectable } from "@angular/core";
import { Router, UrlTree, NavigationExtras, ActivatedRoute } from "@angular/router";
import { NSLocationStrategy, NavigationOptions, Outlet } from "./ns-location-strategy";
import { FrameService } from "../platform-providers";

export type ExtendedNavigationExtras = NavigationExtras & NavigationOptions;

export interface BackNavigationOptions {
    outlets?: Array<string>;
    relativeTo?: ActivatedRoute | null;
}

@Injectable()
export class RouterExtensions {

    constructor(
        public router: Router,
        public locationStrategy: NSLocationStrategy,
        public frameService: FrameService
    ) { }

    public navigate(commands: any[], extras?: ExtendedNavigationExtras): Promise<boolean> {
        if (extras) {
            this.locationStrategy._setNavigationOptions(extras);
        }
        return this.router.navigate(commands, extras);
    }

    public navigateByUrl(url: string | UrlTree, options?: NavigationOptions): Promise<boolean> {
        if (options) {
            this.locationStrategy._setNavigationOptions(options);
        }
        return this.router.navigateByUrl(url);
    }

    public back(backNavigationOptions?: BackNavigationOptions) {
        if (backNavigationOptions) {
            this.backOutlets(backNavigationOptions);
        } else {
            this.locationStrategy.back();
        }
    }

    public canGoBack() {
        return this.locationStrategy.canGoBack();
    }

    public backToPreviousPage() {
        this.frameService.getFrame().goBack();
    }

    public canGoBackToPreviousPage(): boolean {
        return this.frameService.getFrame().canGoBack();
    }

    private backOutlets(options: BackNavigationOptions) {
        const rootRoute: ActivatedRoute = this.router.routerState.root;
        const outletsToBack: Array<Outlet> = [];
        const outlets = options.outlets || ["primary"];
        let relativeRoute: ActivatedRoute = options.relativeTo;

        if (!options.outlets && relativeRoute) {
            relativeRoute = relativeRoute.parent || rootRoute;
        } else if (!relativeRoute) {
            relativeRoute = rootRoute;
        }

        for (let index = 0; index < relativeRoute.children.length; index++) {
            const currentRoute = relativeRoute.children[index];

            if (outlets.some(currentOutlet => currentOutlet === currentRoute.outlet)) {
                const pathToOutlet = this.locationStrategy.getPathToOutlet(currentRoute);
                outletsToBack.push(this.locationStrategy.findOutlet(pathToOutlet));
            }
        }

        if (outletsToBack.length !== outlets.length) {
            throw new Error("No outlet found relative to activated route");
        }

        outletsToBack.forEach(outletToBack => {
            this.locationStrategy.back(outletToBack);
        });
    }
}
