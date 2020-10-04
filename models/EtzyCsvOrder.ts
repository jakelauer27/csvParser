import {StandardCsvOrder} from "./StandardCsvOrder";

export class EtzyCsvOrder {
    public "Sale Date": string;
    public "Order ID": string;
    public "Full Name": string;
    public "Number of Items": string;
    public "SKU": string | null;

    constructor(initializer?: {
        "Sale Date": string,
        "Order ID": string,
        "Full Name": string,
        "Number of Items": string,
        "SKU": string | null,
    }) {
        this["Sale Date"] = !initializer ? "" : initializer["Sale Date"];
        this["Order ID"] = !initializer ? "" : initializer["Order ID"];
        this["Full Name"] = !initializer ? "" : initializer["Full Name"];
        this["Number of Items"] = !initializer ? "1" : initializer["Number of Items"];
        this.SKU = !initializer ? "" : initializer.SKU;
    }

    public mapToStandardOrder(quantityOf?: number): StandardCsvOrder {
        const sku = quantityOf && this.SKU ? this.SKU.split(",")[quantityOf - 1] : this.SKU;                     
                              
        return new StandardCsvOrder({
            metal: this.parseIsMetal(sku),
            date: this["Sale Date"],
            orderNumber: this["Order ID"],
            shop: "E",
            size: null,
            sku: sku,
            design: "",
            designNotes: "",
            color: "",
            customization: "",
            name: this["Full Name"],
            board: "",
            shippingNotes: quantityOf ? `${quantityOf} of ${this["Number of Items"]}` : "",
        });
    }

    private parseIsMetal(sku: string): string {
        if (!sku) {
            return "";
        } else if (sku.includes("EM")) {
            return "M";
        } else {
            return "";
        }
    }
}
