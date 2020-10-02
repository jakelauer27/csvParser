import {StandardCsvOrder} from "./StandardCsvOrder";

export class ShopifyCsvData {
    public "Date Ordered [Date Only]": string;
    public "#Order": string;
    public "SKU": string | null;
    public "Product Name": string;
    public "Variant Title": string;
    public "Properties": string;
    public "Shipping Fullname": string;
    public "Quantity": string;

    constructor(initializer?: {
        "Date Ordered [Date Only]": string,
        "#Order": string,
        "SKU": string | null,
        "Product Name": string,
        "Variant Title": string,
        "Properties": string,
        "Shipping Fullname": string,
        "Quantity": string,
    }) {
        this["Date Ordered [Date Only]"] = !initializer ? "" : initializer["Date Ordered [Date Only]"];
        this["#Order"] = !initializer ? "" : initializer["#Order"];
        this.SKU = !initializer ? "" : initializer.SKU;
        this["Product Name"] = !initializer ? "" : initializer["Product Name"];
        this["Variant Title"] = !initializer ? "" : initializer["Variant Title"];
        this.Properties = !initializer ? "" : initializer.Properties;
        this["Shipping Fullname"] = !initializer ? "" : initializer["Shipping Fullname"];
        this.Quantity = !initializer ? "" : initializer.Quantity;
    }

    public mapToStandardOrder(quantityOf?: number): StandardCsvOrder {
        const widthColor = this.parseColorAndWidth();

        return new StandardCsvOrder({
            metal: this.parseIsMetal(),
            date: this["Date Ordered [Date Only]"],
            orderNumber: this["#Order"],
            shop: "S",
            size: widthColor ? widthColor.width : null,
            sku: this.SKU,
            design: this["Product Name"],
            designNotes: "",
            color: widthColor ? widthColor.color : "",
            customization: this.parseCustomization(),
            name: this["Shipping Fullname"],
            board: "",
            shippingNotes: quantityOf ? `${quantityOf} of ${this.Quantity}` : "",
        });
    }

    private parseIsMetal(): string {
        if (!this.SKU) {
            return "";
        } else {
            return !this.SKU.includes("PROMO") ? "M" : "";
        }
    }

    private parseCustomization(): string {
        if (!this.Properties) {
            return "";
        }

        if (this.Properties.includes("shopify.com") || this.Properties.includes("_design_Preview")) {
            return "PATTERN MONOGRAM: ENTER MANUALLY";
        }

        const options = this.Properties.split("\n").filter((option) => !option.includes("_Color"));

        return options.reduce((customization: string, option) => {
            customization = `${customization}${option.split(":")[1].trim()}`;

            return customization;
        }, "");
    }

    private parseColorAndWidth(): { color: string, width: number | null } {
        if (this["Variant Title"] === "Default Title") {
            return {
                color: "",
                width: null,
            };
        }

        const splitVariants = this["Variant Title"].split("/");
        const width = splitVariants[0].split('"')[0];
        let color = splitVariants[1] ? splitVariants[1].split("(")[0] : "";

        if (color.trim() === "Unpainted") {
            color = "";
        }

        return {
            color: color.trim(),
            width: parseInt(width.replace(/\D/g, ""), 10),
        };
    }
}
