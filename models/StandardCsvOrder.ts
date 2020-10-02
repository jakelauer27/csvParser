export class StandardCsvOrder {
    public metal: string;
    public date: string;
    public orderNumber: string;
    public shop: string;
    public size: number | null;
    public sku: string | null;
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
        sku: string | null,
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
