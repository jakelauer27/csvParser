import {createObjectCsvWriter} from "csv-writer";
import csvToJson from "csvtojson";

interface ShopifyCsvData {
    "Date Ordered [Date Only]": string;
    "#Order": string;
    "Empty 1": null;
    "Empty 2": null;
    "SKU": string;
    "Product Name": string;
    "Empty 3": null;
    "Empty 4": null;
    "Variant Title": string;
    "Properties": string;
    "Shipping Fullname": string;
    "Quantity": string;
}

interface EtsyCsvData {
    test: string;
    etc: string;
}

class StandardCsvData {
    public metal: string;
    public date: string;
    public orderNumber: string;
    public shop: string;
    public size: number | null;
    public sku: string;
    public design: string;
    public designNotes: string;
    public color: string;
    public customization: string;
    public name: string;
    public board: string;
    public shippingNotes: string;

    constructor(initializer?: {
        metal: string,
        date: string,
        orderNumber: string,
        shop: string,
        size: number | null,
        sku: string,
        design: string,
        designNotes: string,
        color: string,
        customization: string,
        name: string,
        board: string,
        shippingNotes: string,
    }) {
        this.metal = !initializer ? "" : initializer.metal;
        this.date = !initializer ? "" : initializer.date;
        this.orderNumber = !initializer ? "" : initializer.orderNumber;
        this.shop = !initializer ? "" : initializer.shop;
        this.size = !initializer ? 0 : initializer.size;
        this.sku = !initializer ? "" : initializer.sku;
        this.design = !initializer ? "" : initializer.design;
        this.designNotes = !initializer ? "" : initializer.designNotes;
        this.color = !initializer ? "" : initializer.color;
        this.customization = !initializer ? "" : initializer.customization;
        this.name = !initializer ? "" : initializer.name;
        this.board = !initializer ? "" : initializer.board;
        this.shippingNotes = !initializer ? "" : initializer.shippingNotes;
    }
}

const outputFileName = process.argv[4];
const outputFileHeaders = [
    {id: "metal", title: "M?"},
    {id: "date", title: "Date"},
    {id: "orderNumber", title: "Order Number"},
    {id: "shop", title: "Shop"},
    {id: "size", title: "Size"},
    {id: "sku", title: "Sku"},
    {id: "design", title: "Design"},
    {id: "designNotes", title: "Design Notes"},
    {id: "color", title: "color"},
    {id: "customization", title: "Customization"},
    {id: "name", title: "Name"},
    {id: "board", title: "Board"},
    {id: "shippingNotes", title: "Shipping Notes"},
];

const csvWriter = createObjectCsvWriter({
    header: outputFileHeaders,
    path: `../../Desktop/${outputFileName}`,
});

function mapShopifyCsvToStandardCsv(csvImportFileName: string, csvOutputFileName: string) {
    const csvFilePath = `../../Downloads/${csvImportFileName}`;

    csvToJson()
        .fromFile(csvFilePath)
        .then((shoppifyData: ShopifyCsvData[]) => {
            const groupedOrders: { [orderNumber: string]: ShopifyCsvData[] } =
                shoppifyData.reduce((acc: { [orderNumber: string]: ShopifyCsvData[] }, item) => {
                    if (acc[item["#Order"]]) {
                        acc[item["#Order"]].push(item);
                    } else {
                        acc[item["#Order"]] = [item];
                    }

                    return acc;
                }, {});

            const mappedGroupOrders = Object.values(groupedOrders).map((orderGroup) => {
                return orderGroup.reduce((group: StandardCsvData[], order) => {
                    if (parseInt(order.Quantity, 10) === 1) {
                        group.push(mapShopifyOrderToStandard(order));
                    } else {
                        for (let i = 1; i <= parseInt(order.Quantity, 10); i++) {
                            group.push(mapShopifyOrderToStandard(order, i));
                        }
                    }

                    return group;
                }, []);
            });

            const flatMapOrders = mappedGroupOrders.reduce((acc: StandardCsvData[], group) => {
                group.forEach((order) => {
                    acc.push(order);
                });

                return acc;
            }, []);

            csvWriter
                .writeRecords(flatMapOrders as any)
                .then(() => console.log("The CSV file was transformed successfully"));

        });
}

function mapShopifyOrderToStandard(order: ShopifyCsvData, quantityOf?: number): StandardCsvData {
    const widthColor = parseVariantTitle(order["Variant Title"]);
    const orderIsMetal = isMetal(order.SKU);

    return new StandardCsvData({
        metal: orderIsMetal ? "M" : "",
        date: order["Date Ordered [Date Only]"],
        orderNumber: order["#Order"],
        shop: "S",
        size: widthColor ? widthColor.width : null,
        sku: order.SKU,
        design: order["Product Name"],
        designNotes: "",
        color: widthColor ? widthColor.color : "",
        customization: parseCustomization(order.Properties),
        name: order["Shipping Fullname"],
        board: "",
        shippingNotes: quantityOf ? `${quantityOf} of ${order.Quantity}` : "",
    });
}

function isMetal(sku: string): boolean {
    if (!sku) {
        return false;
    } else {
        return !sku.includes("PROMO");
    }
}

function parseCustomization(customizationString: string): string {
    if (!customizationString) {
        return "";
    }

    const options = customizationString.split("\n").filter((option) => !option.includes("_Color"));

    return options.reduce((customization: string, option) => {
        customization = `${customization}${option.split(":")[1].trim()}`;

        return customization;
    }, "");
}

function parseVariantTitle(variantTitle: string): { color: string, width: number } | null {
    if (variantTitle === "Default Title") {
        return null;
    }

    const splitVariants = variantTitle.split("/");
    const width = splitVariants[0];
    let color = splitVariants[1] ? splitVariants[1].split("(")[0] : "";

    if (color.trim() === "Unpainted") {
        color = "";
    }

    return {
        color: color.trim(),
        width: parseInt(width.replace(/\D/g, ""), 10),
    };
}

function mapEtsyCsvToStandardCsv(csvImportFileName: string, csvOutputFileName: string) {
    //TODO: implement
}

function mapToCsv(
    inputSource: string,
    csvImportFileName: string,
    csvOutputFileName: string,
) {
    if (!inputSource || !csvOutputFileName || !csvImportFileName) {
        console.log('Invalid Command Format');
        return;
    }

    switch (inputSource) {
        case "shopify":
            mapShopifyCsvToStandardCsv(csvImportFileName, csvOutputFileName);
            break;
        case "etsy":
            mapShopifyCsvToStandardCsv(csvImportFileName, csvOutputFileName);
            break;
    }
}

mapToCsv(process.argv[2], process.argv[3], process.argv[4]);