import {createObjectCsvWriter} from "csv-writer";
import csvToJson from "csvtojson";
import {outputFileHeaders} from "./constants/OutputFileHeaders";
import {EtzyCsvOrder} from "./models/EtzyCsvOrder";
import {ShopifyCsvData} from "./models/ShopifyCsvOrder";
import {StandardCsvOrder} from "./models/StandardCsvOrder";

async function mapShopifyCsvToStandardCsv(
    csvWriter: any,
    csvImportFileName: string,
    logDetails: string,
) {
    const csvImportFilePath = `../../Downloads/${csvImportFileName}`;

    const shopifyDataJson: any[] = await csvToJson().fromFile(csvImportFilePath);

    const groupedOrdersByOrderNumber: { [orderNumber: string]: ShopifyCsvData[] } =
        shopifyDataJson.reduce((groupedOrders: { [orderNumber: string]: ShopifyCsvData[] }, item: any) => {
            item = new ShopifyCsvData(item);

            if (groupedOrders[item["#Order"]]) {
                groupedOrders[item["#Order"]].push(item);
            } else {
                groupedOrders[item["#Order"]] = [item];
            }

            return groupedOrders;
        }, {});

    const standardizedOrderGroups = Object.values(groupedOrdersByOrderNumber).map((orderGroup) => {
        return orderGroup.reduce((group: StandardCsvOrder[], order) => {
            if (parseInt(order.Quantity, 10) === 1) {
                group.push(order.mapToStandardOrder());
            } else {
                for (let i = 1; i <= parseInt(order.Quantity, 10); i++) {
                    group.push(order.mapToStandardOrder(i));
                }
            }

            return group;
        }, []);
    });

    const cleanedOrders = standardizedOrderGroups.reduce((acc: StandardCsvOrder[], group) => {
        group.forEach((order) => {
            acc.push(order);
        });

        return acc;
    }, []);

    try {
        await csvWriter.writeRecords(cleanedOrders as any);
        console.log("The CSV file was transformed successfully");

        if (logDetails === "-details") {
            logDetailSummary(standardizedOrderGroups, cleanedOrders);
        }
    } catch (e) {
        console.log("Unable to create new CSV file", e);
    }
}

async function mapEtsyCsvToStandardCsv(
    csvWriter: any,
    csvImportFileName: string,
    logDetails: string,
) {
    const csvImportFilePath = `../../Downloads/${csvImportFileName}`;

    const etsyDataJson: any[] = await csvToJson().fromFile(csvImportFilePath);

    const groupedOrdersByOrderNumber: { [orderNumber: string]: EtzyCsvOrder[] } =
        etsyDataJson.reduce((groupedOrders: { [orderNumber: string]: EtzyCsvOrder[] }, item: any) => {
            item = new EtzyCsvOrder(item);

            if (groupedOrders[item["Order ID"]]) {
                groupedOrders[item["Order ID"]].push(item);
            } else {
                groupedOrders[item["Order ID"]] = [item];
            }

            return groupedOrders;
        }, {});

    const standardizedOrderGroups = Object.values(groupedOrdersByOrderNumber).map((orderGroup) => {
        return orderGroup.reduce((group: StandardCsvOrder[], order) => {
            if (parseInt(order["Number of Items"], 10) === 1) {
                group.push(order.mapToStandardOrder());
            } else {
                for (let i = 1; i <= parseInt(order["Number of Items"], 10); i++) {
                    group.push(order.mapToStandardOrder(i));
                }
            }

            return group;
        }, []);
    });

    const cleanedOrders = standardizedOrderGroups.reduce((acc: StandardCsvOrder[], group) => {
        group.forEach((order) => {
            acc.push(order);
        });

        return acc;
    }, []);

    try {
        await csvWriter.writeRecords(cleanedOrders as any);
        console.log("The CSV file was transformed successfully");

        if (logDetails === "-details") {
            logDetailSummary(standardizedOrderGroups, cleanedOrders);
        }
    } catch (e) {
        console.log("Unable to create new CSV file", e);
    }
}

function logDetailSummary(standardizedOrderGroups: StandardCsvOrder[][], cleanedOrders: StandardCsvOrder[]) {
    const totalOrders = standardizedOrderGroups.length;
    const totalPromoItems = cleanedOrders.filter((order) => order.sku && order.sku.includes("PROMO")).length;
    const totalItemsWithPromoItems = cleanedOrders.length;
    const totalItemsWithoutPromoItems = totalItemsWithPromoItems - totalPromoItems;
    const averageItemsPerOrder = (totalItemsWithPromoItems / totalOrders).toFixed(2);
    const itemsByDesign = cleanedOrders.reduce((acc: { [design: string]: number }, order) => {
        if (acc[order.design]) {
            acc[order.design]++;
        } else {
            acc[order.design] = 1;
        }

        return acc;
    }, {});

    console.log(
        "totalOrders:", totalOrders, "\n",
        "totalPromoItems:", totalPromoItems, "\n",
        "totalItemsWithoutPromoItems:", totalItemsWithoutPromoItems, "\n",
        "totalItemsWithPromoItems:", totalItemsWithPromoItems, "\n",
        "averageItemsPerOrder:", averageItemsPerOrder, "\n",
        "itemsByDesign:", itemsByDesign, "\n",
    );
}

async function mapToCsv(
    csvType: string,
    csvImportFileName: string,
    csvOutputFileName: string,
    logDetails: string,
) {
    if (!csvType || !csvOutputFileName || !csvImportFileName) {
        console.log("Invalid Command Format");
        return;
    }

    const csvWriter = createObjectCsvWriter({
        header: outputFileHeaders,
        path: `../../Desktop/${csvOutputFileName}`,
    });

    switch (csvType) {
        case "shopify":
            await mapShopifyCsvToStandardCsv(csvWriter, csvImportFileName, logDetails);
            break;
        case "etsy":
            await mapEtsyCsvToStandardCsv(csvWriter, csvImportFileName, logDetails);
            break;
    }
}

mapToCsv(process.argv[2], process.argv[3], process.argv[4], process.argv[5]);