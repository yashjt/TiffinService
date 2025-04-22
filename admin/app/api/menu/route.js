import { NextResponse } from "next/server";

import connectToDatabase from "@/app/utils/mongodb";

import Menu from "@/app/models/Menu";

import { getSession } from "@auth0/nextjs-auth0";

export async function GET() {
  try {
    await connectToDatabase();
    const menuItems = await Menu.find({});
    return NextResponse.json({ success: true, data: menuItems });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    await connectToDatabase();
    const data = await request.json();
    const menuItem = await Menu.create(data);
    return NextResponse.json(
      { success: true, data: menuItem },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
