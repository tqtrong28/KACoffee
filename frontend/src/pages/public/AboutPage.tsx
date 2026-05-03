import { showcaseDrinks } from "../../utils/productMedia";

const trustPillars = [
  {
    title: "Nguyên liệu chọn lọc",
    description: "Từ nền espresso đậm vị đến các dòng cold brew và đồ uống mang đi, mọi món đều được giữ theo tiêu chí dễ uống, rõ vị và ổn định mỗi ngày."
  },
  {
    title: "Phục vụ chỉn chu",
    description: "KACoffee theo đuổi trải nghiệm gọn gàng từ khâu pha chế, đóng gói đến giao nhận để khách ghé quán hay đặt online đều thấy yên tâm."
  },
  {
    title: "Hương vị đáng quay lại",
    description: "Menu được xây để vừa có món quen dễ chọn, vừa có những món signature tạo cảm giác riêng, đủ tinh tế để trở thành lựa chọn thường xuyên."
  }
];

export function AboutPage() {
  return (
    <section className="about-shell">
      <article className="card about-intro reveal-up">
        <div className="about-copy">
          <p className="eyebrow">Một điểm hẹn cà phê đáng tin giữa lòng Hà Nội</p>
          <h1>Về KACoffee</h1>
          <p className="lead">
            KACoffee được xây dựng như một quán cà phê hiện đại dành cho những người thích đồ uống chỉn chu, vị ổn định và cảm giác thân quen mỗi lần quay lại.
          </p>
          <p>
            Chúng mình tin một ly cà phê ngon không chỉ nằm ở hạt hay công thức, mà còn ở cách quán giữ chất lượng đều tay, đóng gói tử tế và phục vụ đủ tinh tế để khách luôn cảm thấy đáng tin.
          </p>
          <p>
            Từ ly latte mang đi buổi sáng, cold brew chai tiện lợi cho ngày bận rộn đến những shot espresso đậm vị tại quầy, KACoffee hướng tới một trải nghiệm gọn gàng, ấm áp và có gu.
          </p>
        </div>
        <div className="about-gallery">
          {showcaseDrinks.map((drink, index) => (
            <figure
              key={drink.title}
              className="about-image-card reveal-up"
              style={{ animationDelay: `${120 + index * 120}ms` }}
            >
              <img src={drink.imageUrl} alt={drink.title} />
              <figcaption>
                <strong>{drink.title}</strong>
                <span>{drink.subtitle}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </article>

      <article className="card about-story reveal-up" style={{ animationDelay: "120ms" }}>
        <div>
          <h2>Một quán cà phê đáng tin nên mang lại cảm giác như thế nào?</h2>
          <p>
            Đó là khi khách bước vào quán và biết rằng hôm nay ly đồ uống của mình vẫn sẽ ngon như hôm qua. Đó là khi đặt mang đi nhưng ly cà phê vẫn được chuẩn bị cẩn thận, đóng gói sạch sẽ và đến tay đúng tinh thần mà quán muốn gửi gắm.
          </p>
          <p>
            KACoffee chọn đi theo tinh thần đó: không phô trương quá mức, nhưng đầu tư đủ kỹ vào hương vị, sự ổn định và trải nghiệm tổng thể để tạo nên một thương hiệu khiến khách nhớ lâu.
          </p>
        </div>
        <blockquote className="about-quote">
          “Một ly cà phê ngon là ly cà phê khiến khách muốn quay lại vào ngày mai.”
        </blockquote>
      </article>

      <div className="about-pillars">
        {trustPillars.map((pillar, index) => (
          <article
            key={pillar.title}
            className="card about-pillar reveal-up"
            style={{ animationDelay: `${180 + index * 100}ms` }}
          >
            <h3>{pillar.title}</h3>
            <p>{pillar.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
