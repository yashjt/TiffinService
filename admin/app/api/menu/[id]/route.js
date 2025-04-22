import { NextResponse } from "next/server";
import connectToDatabase from "@/app/utils/mongodb";
import Menu from "@/app/models/Menu";
import { getSession } from "@auth0/nextjs-auth0";

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const menuItem = await Menu.findById(params.id);

    if (!menuItem) {
      return NextResponse.json(
        { success: false, message: "Menu Item not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: menuItem });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { session: false, messagee: "Unauthorized" },
        { status: 404 }
      );
    }
    await connectToDatabase();
    const data = await request.json();
    const menuItem = await Menu.findByIdAndUpdate(params.id, data, {
      new: true,
      runValidators: true,
    });
    if (!menuItem) {
      return NextResponse.json(
        { success: false, message: "Menu item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: menuItem });
  } catch (error) {}
}

export async function DELETE(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    await connectToDatabase();
    const menuItem = await Menu.findByIdAndDelete(params.id);

    if (!menuItem) {
      return NextResponse.json(
        {
          success: false,
          message: "Menu Item not found",
        },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
