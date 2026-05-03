from sqlalchemy import select
from sqlalchemy.orm import Session

from app.common.enums import MembershipRankCode, ProductType, RoleCode
from app.core.constants import DEFAULT_BRANCH_CODE, DEFAULT_BRANCH_NAME, HANOI_BRANCHES
from app.core.security import get_password_hash
from app.modules.admin.models import Branch, Employee, Role
from app.modules.catalog.models import Category, Product
from app.modules.discounts.models import Discount, DiscountRankEligibility
from app.modules.membership.models import MembershipRank
from app.modules.performance_targets.models import BranchTargetPolicy, RoleTargetPolicy
from app.modules.system_settings.models import SystemSetting
from app.modules.system_settings.service import DEFAULT_SETTINGS


def _seed_branches(db: Session) -> list[Branch]:
    legacy_default = db.scalar(select(Branch).where(Branch.code == DEFAULT_BRANCH_CODE))
    seeded_branches: list[Branch] = []

    for index, branch_data in enumerate(HANOI_BRANCHES):
        branch = db.scalar(select(Branch).where(Branch.code == branch_data["code"]))
        if not branch and index == 0 and legacy_default:
            branch = legacy_default

        if not branch:
            branch = Branch(**branch_data, is_active=True)
            db.add(branch)
        elif index == 0 and legacy_default and branch.id == legacy_default.id:
            branch.code = branch_data["code"]
            branch.name = branch_data["name"]
            branch.address = branch_data["address"]
            branch.city = branch_data["city"]
            branch.phone = branch_data["phone"]
            branch.opening_hours = branch_data["opening_hours"]
            branch.map_url = branch_data["map_url"]
            branch.image_url = branch_data["image_url"]
            branch.amenities_text = branch_data["amenities_text"]
            branch.is_active = True
            db.add(branch)
        else:
            branch.name = branch_data["name"]
            branch.address = branch_data["address"]
            branch.city = branch_data["city"]
            branch.phone = branch_data["phone"]
            branch.opening_hours = branch_data["opening_hours"]
            branch.map_url = branch_data["map_url"]
            branch.amenities_text = branch_data["amenities_text"]
            branch.is_active = True
            db.add(branch)
        seeded_branches.append(branch)

    db.commit()
    for branch in seeded_branches:
        db.refresh(branch)
    return seeded_branches


def _seed_employee_if_missing(
    db: Session,
    *,
    branch_id: int,
    role_id: int,
    username: str,
    password: str,
    full_name: str,
    phone: str,
) -> None:
    existing_employee = db.scalar(select(Employee).where(Employee.username == username))
    if existing_employee:
        existing_employee.branch_id = branch_id
        existing_employee.role_id = role_id
        existing_employee.full_name = full_name
        existing_employee.phone = phone
        existing_employee.is_active = True
        db.add(existing_employee)
        db.commit()
        return
    db.add(
        Employee(
            branch_id=branch_id,
            role_id=role_id,
            username=username,
            password_hash=get_password_hash(password),
            full_name=full_name,
            phone=phone,
            is_active=True,
        )
    )
    db.commit()


def seed_initial_data(db: Session, admin_username: str, admin_password: str) -> None:
    settings = db.scalar(select(SystemSetting).order_by(SystemSetting.id.asc()))
    if not settings:
        db.add(SystemSetting(**DEFAULT_SETTINGS))
        db.commit()

    branches = _seed_branches(db)

    rank_data = [
        (MembershipRankCode.NEW.value, "Mới", 0, 1),
        (MembershipRankCode.SILVER.value, "Bạc", 100, 2),
        (MembershipRankCode.GOLD.value, "Vàng", 300, 3),
        (MembershipRankCode.DIAMOND.value, "Kim cương", 700, 4),
    ]
    for code, name, min_points, priority in rank_data:
        existing_rank = db.scalar(select(MembershipRank).where(MembershipRank.code == code))
        if not existing_rank:
            db.add(
                MembershipRank(
                    code=code,
                    name=name,
                    min_points=min_points,
                    priority=priority,
                    is_active=True,
                )
            )
        else:
            existing_rank.name = name
            existing_rank.min_points = min_points
            existing_rank.priority = priority
            existing_rank.is_active = True
            db.add(existing_rank)
    db.commit()

    for code, name in [
        (RoleCode.EMPLOYEE.value, "Employee"),
        (RoleCode.MANAGER.value, "Manager"),
        (RoleCode.ADMIN.value, "Admin"),
        (RoleCode.SHIPPER.value, "Shipper"),
    ]:
        if not db.scalar(select(Role).where(Role.code == code)):
            db.add(Role(code=code, name=name, is_active=True))
    db.commit()

    role_target_seed = [
        {
            "role_code": RoleCode.EMPLOYEE.value,
            "monthly_order_target": 80,
            "monthly_revenue_target_vnd": 35_000_000,
            "monthly_delivery_target": 0,
            "bonus_rate_percent": 1,
            "bonus_per_extra_order_vnd": 5_000,
            "bonus_per_extra_delivery_vnd": 0,
            "bonus_flat_vnd": 300_000,
            "is_active": True,
        },
        {
            "role_code": RoleCode.MANAGER.value,
            "monthly_order_target": 180,
            "monthly_revenue_target_vnd": 80_000_000,
            "monthly_delivery_target": 0,
            "bonus_rate_percent": 1,
            "bonus_per_extra_order_vnd": 0,
            "bonus_per_extra_delivery_vnd": 0,
            "bonus_flat_vnd": 500_000,
            "is_active": True,
        },
        {
            "role_code": RoleCode.SHIPPER.value,
            "monthly_order_target": 0,
            "monthly_revenue_target_vnd": 0,
            "monthly_delivery_target": 90,
            "bonus_rate_percent": 0,
            "bonus_per_extra_order_vnd": 0,
            "bonus_per_extra_delivery_vnd": 8_000,
            "bonus_flat_vnd": 250_000,
            "is_active": True,
        },
    ]
    for policy_data in role_target_seed:
        policy = db.scalar(select(RoleTargetPolicy).where(RoleTargetPolicy.role_code == policy_data["role_code"]))
        if not policy:
            db.add(RoleTargetPolicy(**policy_data))
    db.commit()

    for index, branch in enumerate(branches, start=1):
        policy = db.scalar(select(BranchTargetPolicy).where(BranchTargetPolicy.branch_id == branch.id))
        if not policy:
            db.add(
                BranchTargetPolicy(
                    branch_id=branch.id,
                    monthly_order_target=160 + index * 10,
                    monthly_revenue_target_vnd=70_000_000 + index * 5_000_000,
                    bonus_rate_percent=1,
                    bonus_flat_vnd=400_000,
                    is_active=True,
                )
            )
    db.commit()

    branch = branches[0]
    admin_role = db.scalar(select(Role).where(Role.code == RoleCode.ADMIN.value))
    if not db.scalar(select(Employee).where(Employee.username == admin_username)):
        db.add(
            Employee(
                branch_id=branch.id,
                role_id=admin_role.id,
                username=admin_username,
                password_hash=get_password_hash(admin_password),
                full_name="KACoffee Admin",
                phone="0900000000",
                is_active=True,
            )
        )
        db.commit()

    employee_role = db.scalar(select(Role).where(Role.code == RoleCode.EMPLOYEE.value))
    manager_role = db.scalar(select(Role).where(Role.code == RoleCode.MANAGER.value))
    shipper_role = db.scalar(select(Role).where(Role.code == RoleCode.SHIPPER.value))

    manager_seed = [
        ("manager1", "manager123", "KACoffee Manager Tràng Tiền", "0933333331", branches[0].id),
        ("manager2", "manager123", "KACoffee Manager Phố Huế", "0933333332", branches[1].id),
        ("manager3", "manager123", "KACoffee Manager Cầu Giấy", "0933333333", branches[2].id),
        ("manager4", "manager123", "KACoffee Manager Tây Sơn", "0933333334", branches[3].id),
    ]
    staff_seed = [
        ("staff1", "staff123", "KACoffee Staff Tràng Tiền", "0911111111", branches[0].id),
        ("staff2", "staff123", "KACoffee Staff Phố Huế", "0911111112", branches[1].id),
        ("staff3", "staff123", "KACoffee Staff Cầu Giấy", "0911111113", branches[2].id),
        ("staff4", "staff123", "KACoffee Staff Tây Sơn", "0911111114", branches[3].id),
    ]
    shipper_seed = [
        ("shipper1", "ship123", "KACoffee Shipper Tràng Tiền", "0922222221", branches[0].id),
        ("shipper2", "ship123", "KACoffee Shipper Phố Huế", "0922222222", branches[1].id),
        ("shipper3", "ship123", "KACoffee Shipper Cầu Giấy", "0922222223", branches[2].id),
        ("shipper4", "ship123", "KACoffee Shipper Tây Sơn", "0922222224", branches[3].id),
    ]
    for username, password, full_name, phone, branch_id in manager_seed:
        _seed_employee_if_missing(
            db,
            branch_id=branch_id,
            role_id=manager_role.id,
            username=username,
            password=password,
            full_name=full_name,
            phone=phone,
        )
    for username, password, full_name, phone, branch_id in staff_seed:
        _seed_employee_if_missing(
            db,
            branch_id=branch_id,
            role_id=employee_role.id,
            username=username,
            password=password,
            full_name=full_name,
            phone=phone,
        )
    for username, password, full_name, phone, branch_id in shipper_seed:
        _seed_employee_if_missing(
            db,
            branch_id=branch_id,
            role_id=shipper_role.id,
            username=username,
            password=password,
            full_name=full_name,
            phone=phone,
        )

    categories = [
        ("takeaway-coffee", "Pha ly mỗi ngày", "Những món pha ly quen thuộc, dễ chọn và phù hợp nhiều gu vị khác nhau.", 1),
        ("bottled-coffee", "Dòng đóng chai", "Những món cold brew và đồ uống đóng chai tiện lợi, dễ mang theo.", 2),
        ("in-shop-specials", "Signature của quán", "Những món đặc trưng giúp menu KACoffee có điểm nhấn riêng hơn.", 3),
    ]
    for slug, name, description, display_order in categories:
        category = db.scalar(select(Category).where(Category.slug == slug))
        if not category:
            db.add(
                Category(
                    name=name,
                    slug=slug,
                    description=description,
                    display_order=display_order,
                    is_active=True,
                )
            )
        else:
            category.name = name
            category.description = description
            category.display_order = display_order
            category.is_active = True
            db.add(category)
    db.commit()

    category_map = {category.slug: category for category in db.scalars(select(Category)).all()}
    sample_products = [
        {
            "name": "Latte đá",
            "slug": "latte-takeaway",
            "description": "Latte cân bằng giữa espresso và sữa tươi, dễ uống cho mọi thời điểm trong ngày.",
            "product_type": ProductType.TAKEAWAY.value,
            "price_vnd": 45_000,
            "category_slug": "takeaway-coffee",
            "image_url": None,
            "is_online_available": True,
            "badge_text": "Bán chạy",
            "flavor_note": "Êm vị, hậu ngọt nhẹ",
            "is_featured": True,
        },
        {
            "name": "Cold brew nguyên bản",
            "slug": "cold-brew-bottle",
            "description": "Cold brew đậm vị, mát lạnh và giữ hậu vị sạch, gọn.",
            "product_type": ProductType.BOTTLED.value,
            "price_vnd": 55_000,
            "category_slug": "bottled-coffee",
            "image_url": None,
            "is_online_available": True,
            "badge_text": "Signature",
            "flavor_note": "Mát lạnh, đậm hậu vị",
            "is_featured": True,
        },
        {
            "name": "Espresso signature",
            "slug": "signature-espresso",
            "description": "Espresso đậm hương và tròn vị cho những ai thích nền cà phê rõ nét.",
            "product_type": ProductType.IN_SHOP.value,
            "price_vnd": 39_000,
            "category_slug": "in-shop-specials",
            "image_url": None,
            "is_online_available": True,
            "badge_text": "Đậm vị",
            "flavor_note": "Rõ hương cacao rang",
            "is_featured": True,
        },
        {
            "name": "Cà phê đen đá",
            "slug": "iced-black-coffee-takeaway",
            "description": "Cà phê đen đá đậm vị, gọn gàng và tỉnh táo cho ngày mới.",
            "product_type": ProductType.TAKEAWAY.value,
            "price_vnd": 32_000,
            "category_slug": "takeaway-coffee",
            "image_url": None,
            "is_online_available": True,
            "badge_text": "Quen vị",
            "flavor_note": "Đắng rõ, gọn hậu",
            "is_featured": False,
        },
        {
            "name": "Cà phê sữa đá",
            "slug": "iced-milk-coffee-takeaway",
            "description": "Hương vị quen thuộc, đậm cà phê và ngọt dịu vừa phải.",
            "product_type": ProductType.TAKEAWAY.value,
            "price_vnd": 35_000,
            "category_slug": "takeaway-coffee",
            "image_url": None,
            "is_online_available": True,
            "badge_text": "Quốc dân",
            "flavor_note": "Đậm cà phê, ngọt dịu",
            "is_featured": True,
        },
        {
            "name": "Bạc xỉu",
            "slug": "bac-xiu-takeaway",
            "description": "Thơm sữa, nhẹ cà phê, phù hợp với khách thích vị êm.",
            "product_type": ProductType.TAKEAWAY.value,
            "price_vnd": 38_000,
            "category_slug": "takeaway-coffee",
            "image_url": None,
            "is_online_available": True,
            "badge_text": "Ít đắng",
            "flavor_note": "Sữa thơm, cà phê nhẹ",
            "is_featured": False,
        },
        {
            "name": "Americano đá",
            "slug": "americano-iced-takeaway",
            "description": "Americano thanh vị, hậu vị gọn và phù hợp với những ai thích vị sạch, rõ cà phê.",
            "product_type": ProductType.TAKEAWAY.value,
            "price_vnd": 40_000,
            "category_slug": "takeaway-coffee",
            "image_url": None,
            "is_online_available": True,
            "badge_text": "Thanh vị",
            "flavor_note": "Gọn, sạch vị",
            "is_featured": False,
        },
        {
            "name": "Cappuccino",
            "slug": "cappuccino-takeaway",
            "description": "Cappuccino bồng bềnh, cân bằng giữa espresso và sữa.",
            "product_type": ProductType.TAKEAWAY.value,
            "price_vnd": 46_000,
            "category_slug": "takeaway-coffee",
            "image_url": None,
            "is_online_available": True,
            "badge_text": "Foam mịn",
            "flavor_note": "Béo nhẹ, thơm sữa",
            "is_featured": False,
        },
        {
            "name": "Mocha",
            "slug": "mocha-takeaway",
            "description": "Sự kết hợp giữa cà phê và chocolate cho vị đậm, ngọt vừa.",
            "product_type": ProductType.TAKEAWAY.value,
            "price_vnd": 49_000,
            "category_slug": "takeaway-coffee",
            "image_url": None,
            "is_online_available": True,
            "badge_text": "Ngọt vừa",
            "flavor_note": "Chocolate đậm, mềm vị",
            "is_featured": False,
        },
        {
            "name": "Caramel macchiato",
            "slug": "caramel-macchiato-takeaway",
            "description": "Vị caramel thơm ngọt, phù hợp khách thích trải nghiệm mềm mại.",
            "product_type": ProductType.TAKEAWAY.value,
            "price_vnd": 52_000,
            "category_slug": "takeaway-coffee",
            "image_url": None,
            "is_online_available": True,
            "badge_text": "Mới",
            "flavor_note": "Caramel thơm, ngọt dịu",
            "is_featured": False,
        },
        {
            "name": "Matcha latte",
            "slug": "matcha-latte-takeaway",
            "description": "Matcha dịu vị, thêm lựa chọn nhẹ nhàng cho buổi chiều.",
            "product_type": ProductType.TAKEAWAY.value,
            "price_vnd": 48_000,
            "category_slug": "takeaway-coffee",
            "image_url": None,
            "is_online_available": True,
            "badge_text": "Êm dịu",
            "flavor_note": "Trà xanh, sữa mềm",
            "is_featured": False,
        },
        {
            "name": "Cold brew cam",
            "slug": "cold-brew-orange-takeaway",
            "description": "Cold brew kết hợp vị cam tươi tạo cảm giác mát và sáng vị.",
            "product_type": ProductType.TAKEAWAY.value,
            "price_vnd": 54_000,
            "category_slug": "takeaway-coffee",
            "image_url": None,
            "is_online_available": True,
            "badge_text": "Theo mùa",
            "flavor_note": "Cam tươi, sáng vị",
            "is_featured": True,
        },
        {
            "name": "Flat white",
            "slug": "flat-white-takeaway",
            "description": "Flat white mịn sữa và rõ nền espresso cho người thích vị cân bằng.",
            "product_type": ProductType.TAKEAWAY.value,
            "price_vnd": 47_000,
            "category_slug": "takeaway-coffee",
            "image_url": None,
            "is_online_available": True,
            "badge_text": "Cân bằng",
            "flavor_note": "Espresso rõ, sữa mịn",
            "is_featured": False,
        },
        {
            "name": "Cold brew sữa yến mạch",
            "slug": "cold-brew-oatmilk-bottle",
            "description": "Cold brew kết hợp sữa yến mạch, nhẹ bụng và thanh vị.",
            "product_type": ProductType.BOTTLED.value,
            "price_vnd": 60_000,
            "category_slug": "bottled-coffee",
            "image_url": None,
            "is_online_available": True,
            "badge_text": "Lành bụng",
            "flavor_note": "Thanh, dịu, ít ngọt",
            "is_featured": False,
        },
        {
            "name": "Cold brew vanilla",
            "slug": "cold-brew-vanilla-bottle",
            "description": "Cold brew pha vanilla nhẹ, thơm dịu và dễ uống.",
            "product_type": ProductType.BOTTLED.value,
            "price_vnd": 62_000,
            "category_slug": "bottled-coffee",
            "image_url": None,
            "is_online_available": True,
            "badge_text": "Ngọt dịu",
            "flavor_note": "Vanilla nhẹ, hậu êm",
            "is_featured": False,
        },
        {
            "name": "Cold brew hazelnut",
            "slug": "cold-brew-hazelnut-bottle",
            "description": "Hazelnut thơm nồng trên nền cold brew mát lạnh.",
            "product_type": ProductType.BOTTLED.value,
            "price_vnd": 62_000,
            "category_slug": "bottled-coffee",
            "image_url": None,
            "is_online_available": True,
            "badge_text": "Thơm hạt",
            "flavor_note": "Hazelnut rõ, hậu đậm",
            "is_featured": False,
        },
        {
            "name": "Cà phê sữa",
            "slug": "milk-coffee-bottle",
            "description": "Phiên bản cà phê sữa đậm vị, ngọt dịu và tiện thưởng thức bất kỳ lúc nào.",
            "product_type": ProductType.BOTTLED.value,
            "price_vnd": 58_000,
            "category_slug": "bottled-coffee",
            "image_url": None,
            "is_online_available": True,
            "badge_text": "Tiện mang theo",
            "flavor_note": "Đậm sữa, quen vị",
            "is_featured": True,
        },
        {
            "name": "Bạc xỉu lạnh",
            "slug": "bac-xiu-bottle",
            "description": "Bạc xỉu thơm sữa, dịu cà phê và rất dễ uống.",
            "product_type": ProductType.BOTTLED.value,
            "price_vnd": 56_000,
            "category_slug": "bottled-coffee",
            "image_url": None,
            "is_online_available": True,
            "badge_text": "Dễ uống",
            "flavor_note": "Sữa thơm, nhẹ cà phê",
            "is_featured": False,
        },
        {
            "name": "Cold brew dừa",
            "slug": "cold-brew-coconut-bottle",
            "description": "Cold brew pha cùng vị dừa nhẹ, tạo cảm giác mới mẻ và mát lạnh.",
            "product_type": ProductType.BOTTLED.value,
            "price_vnd": 64_000,
            "category_slug": "bottled-coffee",
            "image_url": None,
            "is_online_available": True,
            "badge_text": "Mát lạnh",
            "flavor_note": "Dừa nhẹ, tươi vị",
            "is_featured": False,
        },
        {
            "name": "Cold brew caramel",
            "slug": "cold-brew-caramel-bottle",
            "description": "Caramel ngọt dịu hòa cùng cold brew cho vị tròn đầy.",
            "product_type": ProductType.BOTTLED.value,
            "price_vnd": 62_000,
            "category_slug": "bottled-coffee",
            "image_url": None,
            "is_online_available": True,
            "badge_text": "Mềm vị",
            "flavor_note": "Caramel thơm, hậu dài",
            "is_featured": False,
        },
        {
            "name": "Espresso con panna",
            "slug": "espresso-con-panna",
            "description": "Espresso kết hợp lớp kem tươi để vị đậm trở nên mềm mại hơn.",
            "product_type": ProductType.IN_SHOP.value,
            "price_vnd": 45_000,
            "category_slug": "in-shop-specials",
            "image_url": None,
            "is_online_available": True,
            "badge_text": "Kem mịn",
            "flavor_note": "Kem tươi, espresso đậm",
            "is_featured": False,
        },
        {
            "name": "Affogato kem vanilla",
            "slug": "affogato-vanilla",
            "description": "Kem vanilla chan espresso nóng tạo nên món tráng miệng nổi bật và giàu tương phản vị.",
            "product_type": ProductType.IN_SHOP.value,
            "price_vnd": 59_000,
            "category_slug": "in-shop-specials",
            "image_url": None,
            "is_online_available": True,
            "badge_text": "Best seller",
            "flavor_note": "Kem lạnh, espresso nóng",
            "is_featured": True,
        },
        {
            "name": "Cà phê muối",
            "slug": "salt-coffee-in-shop",
            "description": "Cà phê muối béo nhẹ, đậm đà và tạo dư vị rất riêng.",
            "product_type": ProductType.IN_SHOP.value,
            "price_vnd": 52_000,
            "category_slug": "in-shop-specials",
            "image_url": None,
            "is_online_available": True,
            "badge_text": "Đậm vị",
            "flavor_note": "Béo nhẹ, mặn dịu",
            "is_featured": True,
        },
        {
            "name": "Espresso tonic",
            "slug": "espresso-tonic-in-shop",
            "description": "Espresso tonic mang cảm giác tươi mới, lý tưởng cho buổi chiều.",
            "product_type": ProductType.IN_SHOP.value,
            "price_vnd": 56_000,
            "category_slug": "in-shop-specials",
            "image_url": None,
            "is_online_available": True,
            "badge_text": "Mới",
            "flavor_note": "Tươi vị, sủi nhẹ",
            "is_featured": False,
        },
    ]
    for product_data in sample_products:
        small_price_vnd = None
        large_price_vnd = None
        if product_data["product_type"] != ProductType.BOTTLED.value:
            small_price_vnd = max(product_data["price_vnd"] - 5_000, 0)
            large_price_vnd = product_data["price_vnd"] + 7_000
        existing_product = db.scalar(select(Product).where(Product.slug == product_data["slug"]))
        if not existing_product:
            db.add(
                Product(
                    category_id=category_map[product_data["category_slug"]].id,
                    name=product_data["name"],
                    slug=product_data["slug"],
                    description=product_data["description"],
                    product_type=product_data["product_type"],
                    price_vnd=product_data["price_vnd"],
                    small_price_vnd=small_price_vnd,
                    large_price_vnd=large_price_vnd,
                    image_url=product_data["image_url"],
                    badge_text=product_data["badge_text"],
                    flavor_note=product_data["flavor_note"],
                    is_featured=product_data["is_featured"],
                    is_active=True,
                    track_inventory=product_data["product_type"] == ProductType.BOTTLED.value,
                    inventory_qty=100 if product_data["product_type"] == ProductType.BOTTLED.value else 0,
                    is_online_available=product_data["is_online_available"],
                    is_in_store_available=True,
                )
            )
        else:
            if existing_product.small_price_vnd is None:
                existing_product.small_price_vnd = small_price_vnd
            if existing_product.large_price_vnd is None:
                existing_product.large_price_vnd = large_price_vnd
            if existing_product.badge_text is None:
                existing_product.badge_text = product_data["badge_text"]
            if existing_product.flavor_note is None:
                existing_product.flavor_note = product_data["flavor_note"]
            db.add(existing_product)
    db.commit()

    welcome_discount = db.scalar(select(Discount).where(Discount.code == "WELCOME10"))
    if not welcome_discount:
        discount = Discount(
            code="WELCOME10",
            description="Giảm 10% cho tất cả thành viên",
            discount_type="percentage",
            value=10,
            min_order_value_vnd=50000,
            is_active=True,
        )
        db.add(discount)
        db.flush()
        for rank in db.scalars(select(MembershipRank)).all():
            db.add(DiscountRankEligibility(discount_id=discount.id, membership_rank_id=rank.id))
        db.commit()
    else:
        welcome_discount.description = "Giảm 10% cho tất cả thành viên"
        db.add(welcome_discount)
        db.commit()

    silver_discount = db.scalar(select(Discount).where(Discount.code == "SILVER20K"))
    if not silver_discount:
        discount = Discount(
            code="SILVER20K",
            description="Giảm 20.000 VND cho hạng Bạc trở lên",
            discount_type="fixed",
            value=20000,
            min_order_value_vnd=80000,
            is_active=True,
        )
        db.add(discount)
        db.flush()
        eligible_codes = {
            MembershipRankCode.SILVER.value,
            MembershipRankCode.GOLD.value,
            MembershipRankCode.DIAMOND.value,
        }
        for rank in db.scalars(select(MembershipRank).where(MembershipRank.code.in_(eligible_codes))).all():
            db.add(DiscountRankEligibility(discount_id=discount.id, membership_rank_id=rank.id))
        db.commit()
    else:
        silver_discount.description = "Giảm 20.000 VND cho hạng Bạc trở lên"
        db.add(silver_discount)
        db.commit()
