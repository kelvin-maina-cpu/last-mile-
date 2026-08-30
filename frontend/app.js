// ============================================================
// REFLEX FRONTEND
// Retailer + Dispatcher Prototype
// ============================================================



// ============================================================
// NAVIGATION
// ============================================================

const retailerTab = document.getElementById("retailerTab");
const dispatcherTab = document.getElementById("dispatcherTab");

const retailerSection =
    document.getElementById("retailerSection");

const dispatcherSection =
    document.getElementById("dispatcherSection");


retailerTab.addEventListener("click", function () {

    retailerSection.classList.remove("hidden");

    dispatcherSection.classList.add("hidden");

    retailerTab.classList.add("active");

    dispatcherTab.classList.remove("active");

});


dispatcherTab.addEventListener("click", function () {

    retailerSection.classList.add("hidden");

    dispatcherSection.classList.remove("hidden");

    retailerTab.classList.remove("active");

    dispatcherTab.classList.add("active");

    renderDeliveries();

});



// ============================================================
// RETAILER FORM
// ============================================================

const deliveryForm =
    document.getElementById("deliveryForm");

const message =
    document.getElementById("message");

const deliveryResult =
    document.getElementById("deliveryResult");

const deliveryDetails =
    document.getElementById("deliveryDetails");



deliveryForm.addEventListener("submit", function (event) {

    event.preventDefault();


    const customerName =
        document
            .getElementById("customerName")
            .value
            .trim();


    const customerPhone =
        document
            .getElementById("customerPhone")
            .value
            .trim();


    const address =
        document
            .getElementById("address")
            .value
            .trim();


    const itemDescription =
        document
            .getElementById("itemDescription")
            .value
            .trim();



    // Validate required fields

    if (
        !customerName ||
        !customerPhone ||
        !address ||
        !itemDescription
    ) {

        message.textContent =
            "Please complete all delivery fields.";

        message.className =
            "message error";

        return;

    }



    // Create temporary frontend delivery

    const delivery = {

        id: "DEL-" + Date.now(),

        customerName: customerName,

        customerPhone: customerPhone,

        address: address,

        itemDescription: itemDescription,

        status: "REQUESTED",

        rider: null

    };



    // Add to local delivery list

    deliveries.push(delivery);



    // Display created delivery

    deliveryDetails.innerHTML = `

        <div class="detail-item">

            <span class="detail-label">
                Delivery ID
            </span>

            <span class="detail-value">
                ${delivery.id}
            </span>

        </div>


        <div class="detail-item">

            <span class="detail-label">
                Customer
            </span>

            <span class="detail-value">
                ${delivery.customerName}
            </span>

        </div>


        <div class="detail-item">

            <span class="detail-label">
                Phone
            </span>

            <span class="detail-value">
                ${delivery.customerPhone}
            </span>

        </div>


        <div class="detail-item">

            <span class="detail-label">
                Address
            </span>

            <span class="detail-value">
                ${delivery.address}
            </span>

        </div>


        <div class="detail-item">

            <span class="detail-label">
                Item
            </span>

            <span class="detail-value">
                ${delivery.itemDescription}
            </span>

        </div>

    `;



    // Show result

    deliveryResult.classList.remove("hidden");



    // Show success message

    message.textContent =
        "Delivery request created successfully.";

    message.className =
        "message success";



    // Clear form

    deliveryForm.reset();



    // Refresh dispatcher data

    renderDeliveries();

});



// ============================================================
// RIDERS
// ============================================================

const riders = [

    {
        id: "R001",
        name: "Brian Otieno"
    },

    {
        id: "R002",
        name: "Kevin Ochieng"
    },

    {
        id: "R003",
        name: "Samuel Kamau"
    }

];



// ============================================================
// SAMPLE DELIVERY DATA
// ============================================================

let deliveries = [

    {

        id: "DEL-001",

        customerName: "Jane Wanjiku",

        customerPhone: "0712345678",

        address: "Luanda Town",

        itemDescription: "Samsung Television",

        status: "REQUESTED",

        rider: null

    },


    {

        id: "DEL-002",

        customerName: "Peter Ouma",

        customerPhone: "0723456789",

        address: "Mbale Town",

        itemDescription: "Laptop",

        status: "ASSIGNED",

        rider: "Brian Otieno"

    },


    {

        id: "DEL-003",

        customerName: "Mary Achieng",

        customerPhone: "0734567890",

        address: "Luanda Market",

        itemDescription: "Printer",

        status: "PICKED_UP",

        rider: "Kevin Ochieng"

    },


    {

        id: "DEL-004",

        customerName: "David Onyango",

        customerPhone: "0745678901",

        address: "Vihiga Road",

        itemDescription: "Computer Monitor",

        status: "DELIVERED",

        rider: "Samuel Kamau"

    }

];



// ============================================================
// DISPATCHER ELEMENTS
// ============================================================

const dispatcherDeliveries =
    document.getElementById(
        "dispatcherDeliveries"
    );


const emptyState =
    document.getElementById("emptyState");


const totalDeliveries =
    document.getElementById(
        "totalDeliveries"
    );


const requestedDeliveries =
    document.getElementById(
        "requestedDeliveries"
    );


const assignedDeliveries =
    document.getElementById(
        "assignedDeliveries"
    );


const deliveredDeliveries =
    document.getElementById(
        "deliveredDeliveries"
    );



// ============================================================
// RENDER DISPATCHER DASHBOARD
// ============================================================

function renderDeliveries() {

    dispatcherDeliveries.innerHTML = "";



    // Update summary

    updateSummary();



    // Empty state

    if (deliveries.length === 0) {

        emptyState.classList.remove("hidden");

        return;

    }


    emptyState.classList.add("hidden");



    // Render each delivery

    deliveries.forEach(function (delivery) {

        const card =
            document.createElement("div");


        card.className =
            "delivery-card";



        const statusClass =
            getStatusClass(
                delivery.status
            );



        let assignmentHTML = "";



        // If rider is already assigned

        if (delivery.rider) {

            assignmentHTML = `

                <div class="assignment-section">

                    <h4>
                        Assigned Rider
                    </h4>

                    <div class="assigned-rider">
                        ${delivery.rider}
                    </div>

                </div>

            `;

        }


        // If no rider is assigned

        else {

            assignmentHTML = `

                <div class="assignment-section">

                    <h4>
                        Assign Rider
                    </h4>

                    <div class="assignment-controls">

                        <select
                            class="rider-select"
                            id="rider-${delivery.id}"
                        >

                            <option value="">
                                Select rider
                            </option>


                            ${riders.map(function (rider) {

                                return `

                                    <option
                                        value="${rider.name}"
                                    >
                                        ${rider.name}
                                    </option>

                                `;

                            }).join("")}

                        </select>


                        <button
                            class="assign-button"
                            onclick="assignRider('${delivery.id}')"
                        >
                            Assign Rider
                        </button>

                    </div>

                </div>

            `;

        }



        card.innerHTML = `

            <div class="delivery-header">

                <span class="delivery-id">
                    ${delivery.id}
                </span>


                <span
                    class="status-badge ${statusClass}"
                >
                    ${delivery.status}
                </span>

            </div>



            <div class="delivery-info">


                <div class="info-item">

                    <span class="info-label">
                        Customer
                    </span>

                    <span class="info-value">
                        ${delivery.customerName}
                    </span>

                </div>



                <div class="info-item">

                    <span class="info-label">
                        Phone
                    </span>

                    <span class="info-value">
                        ${delivery.customerPhone}
                    </span>

                </div>



                <div class="info-item">

                    <span class="info-label">
                        Address
                    </span>

                    <span class="info-value">
                        ${delivery.address}
                    </span>

                </div>



                <div class="info-item">

                    <span class="info-label">
                        Item
                    </span>

                    <span class="info-value">
                        ${delivery.itemDescription}
                    </span>

                </div>


            </div>



            ${assignmentHTML}

        `;



        dispatcherDeliveries.appendChild(card);

    });

}



// ============================================================
// SUMMARY COUNTERS
// ============================================================

function updateSummary() {

    const requested =
        deliveries.filter(
            function (delivery) {

                return delivery.status === "REQUESTED";

            }
        ).length;


    const assigned =
        deliveries.filter(
            function (delivery) {

                return delivery.status === "ASSIGNED";

            }
        ).length;


    const delivered =
        deliveries.filter(
            function (delivery) {

                return delivery.status === "DELIVERED";

            }
        ).length;



    totalDeliveries.textContent =
        deliveries.length;


    requestedDeliveries.textContent =
        requested;


    assignedDeliveries.textContent =
        assigned;


    deliveredDeliveries.textContent =
        delivered;

}



// ============================================================
// STATUS CLASS
// ============================================================

function getStatusClass(status) {

    switch (status) {

        case "REQUESTED":

            return "status-requested";


        case "ASSIGNED":

            return "status-assigned";


        case "PICKED_UP":

            return "status-picked-up";


        case "DELIVERED":

            return "status-delivered";


        default:

            return "";

    }

}



// ============================================================
// ASSIGN RIDER
// ============================================================

function assignRider(deliveryId) {

    const delivery =
        deliveries.find(
            function (item) {

                return item.id === deliveryId;

            }
        );



    // Delivery not found

    if (!delivery) {

        alert(
            "Delivery could not be found."
        );

        return;

    }



    const riderSelect =
        document.getElementById(
            `rider-${deliveryId}`
        );



    // No rider selected

    if (
        !riderSelect ||
        !riderSelect.value
    ) {

        alert(
            "Please select a rider before assigning."
        );

        return;

    }



    // Assign rider

    delivery.rider =
        riderSelect.value;



    // Move delivery to ASSIGNED

    delivery.status =
        "ASSIGNED";



    // Refresh dashboard

    renderDeliveries();

}