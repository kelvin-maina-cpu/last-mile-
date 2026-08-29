const deliveryForm = document.getElementById("deliveryForm");
const message = document.getElementById("message");
const deliveryResult = document.getElementById("deliveryResult");
const deliveryDetails = document.getElementById("deliveryDetails");

deliveryForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const customerName = document.getElementById("customerName").value.trim();
    const customerPhone = document.getElementById("customerPhone").value.trim();
    const address = document.getElementById("address").value.trim();
    const itemDescription = document.getElementById("itemDescription").value.trim();

    // Validate the form
    if (!customerName || !customerPhone || !address || !itemDescription) {
        message.textContent = "Please complete all delivery fields.";
        message.className = "message error";
        return;
    }

    // Temporary frontend delivery object.
    // The backend will provide the official delivery ID
    // once the API contract is integrated.
    const delivery = {
        id: "DEL-" + Date.now(),
        customerName,
        customerPhone,
        address,
        itemDescription,
        status: "REQUESTED"
    };

    // Display the created delivery
    deliveryDetails.innerHTML = `
        <p><strong>Delivery ID:</strong> ${delivery.id}</p>
        <p><strong>Customer:</strong> ${delivery.customerName}</p>
        <p><strong>Phone:</strong> ${delivery.customerPhone}</p>
        <p><strong>Address:</strong> ${delivery.address}</p>
        <p><strong>Item:</strong> ${delivery.itemDescription}</p>
    `;

    // Show the delivery result
    deliveryResult.classList.remove("hidden");

    // Show success message
    message.textContent = "Delivery request created successfully.";
    message.className = "message success";

    // Clear the form
    deliveryForm.reset();
});